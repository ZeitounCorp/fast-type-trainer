import { useEffect, useRef, useState } from 'react';
import type { TypingResult, LanguageCode } from '../types';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

type Props = {
  words: string[];
  durationSeconds?: number;
  language: LanguageCode;
  onFinish: (result: TypingResult) => void;
  autoStart?: boolean;
};

type WordStatus = 'pending' | 'correct' | 'incorrect';

const TypingTest = ({ words, durationSeconds = 45, language, onFinish, autoStart }: Props) => {
  const { t } = useTranslation();

  const [input, setInput] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(autoStart ? performance.now() : null);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [completed, setCompleted] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [statuses, setStatuses] = useState<WordStatus[]>(() => new Array(words.length).fill('pending'));

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const committedTextRef = useRef('');

  const timerRef = useRef<number | null>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetSession = () => {
    stopTimer();
    setStatuses(new Array(words.length).fill('pending'));
    setActiveIndex(0);
    setInput('');
    setCorrectCount(0);
    setWrongWords([]);
    committedTextRef.current = '';
    setRemaining(durationSeconds);
    setCompleted(false);
    setStartedAt(autoStart ? performance.now() : null);
  };

  useEffect(() => {
    resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, durationSeconds, autoStart]);

  useEffect(() => {
    stopTimer();
    if (!startedAt || completed) return;

    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 0) {
          queueMicrotask(() => finish(performance.now()));
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, completed]);

  useEffect(() => {
    if (areaRef.current) areaRef.current.focus();
  }, []);

  const commitWord = (typedWord: string) => {
    if (completed) return;

    const target = words[activeIndex] ?? '';
    const isCorrect = typedWord === target;

    setStatuses((prev) => {
      const next = [...prev];
      if (activeIndex < next.length) next[activeIndex] = isCorrect ? 'correct' : 'incorrect';
      return next;
    });

    committedTextRef.current += `${typedWord} `;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongWords((list) => [...list, target]);
    }

    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);

    if (nextIndex >= words.length) {
      stopTimer();
      finish(performance.now(), {
        inputOverride: '',
        activeIndexOverride: nextIndex,
      });
      return;
    }

    setInput('');
  };

  const finalize = (endTime: number, overrides?: { inputOverride?: string; activeIndexOverride?: number }) => {
    if (completed) return;

    const start = startedAt ?? endTime;
    const elapsedMs = Math.max(endTime - start, 1);
    const minutes = Math.max(elapsedMs / 60000, 0.001);
    const currentInput = overrides?.inputOverride ?? input;
    const indexToUse = overrides?.activeIndexOverride ?? activeIndex;
    const currentTarget = words[indexToUse] ?? '';

    const targetSequence = words.join(' ');
    const typedSequence = `${committedTextRef.current}${currentInput}`;
    const totalKeys = typedSequence.length;

    // Accuracy is based on committed, finished words only (no partial current input)
    const accuracySequence = committedTextRef.current.trimEnd();
    let correctKeys = 0;
    const len = Math.min(accuracySequence.length, targetSequence.length);
    for (let i = 0; i < len; i++) {
      if (accuracySequence[i] === targetSequence[i]) correctKeys++;
    }
    const accuracyTotal = accuracySequence.length;

    const wpm = totalKeys > 0 ? Math.floor((totalKeys / 5) / minutes) : 0;
    const accuracy = accuracyTotal > 0 ? Math.floor((correctKeys / accuracyTotal) * 100) : 100;
    const errors = Math.max(0, accuracyTotal - correctKeys);

    const wordsTyped = indexToUse + (currentInput.trim().length > 0 ? 1 : 0);
    const currentWordCorrect = currentInput === currentTarget;
    const finalCorrectWords = correctCount + (currentInput.trim().length > 0 && currentWordCorrect ? 1 : 0);

    const finalWrongWords =
      currentInput.trim().length > 0 && !currentWordCorrect ? [...wrongWords, currentTarget] : [...wrongWords];

    const result: TypingResult = {
      wpm,
      cps: Math.round((totalKeys / (elapsedMs / 1000)) * 100) / 100,
      accuracy,
      wordsTyped,
      correctWords: finalCorrectWords,
      errors,
      elapsedMs,
      wrongWords: finalWrongWords,
    };

    setCompleted(true);
    stopTimer();

    const notify = () => onFinish(result);
    if (typeof queueMicrotask === 'function') queueMicrotask(notify);
    else setTimeout(notify, 0);
  };

  const finish = (
    endTime = performance.now(),
    opts?: { inputOverride?: string; activeIndexOverride?: number }
  ) => {
    stopTimer();
    queueMicrotask(() => finalize(endTime, opts));
  };

  const handleChange = (value: string) => {
    if (!startedAt) setStartedAt(performance.now());

    const hasWhitespace = /\s/.test(value);
    if (!hasWhitespace) {
      setInput(value);
      return;
    }

    const endsWithWhitespace = /\s$/.test(value);
    const parts = value.split(/\s+/);
    const last = parts[parts.length - 1] ?? '';
    const completeWords = endsWithWhitespace ? parts.filter(Boolean) : parts.slice(0, -1).filter(Boolean);

    for (const w of completeWords) commitWord(w);

    setInput(endsWithWhitespace ? '' : last);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{language.toUpperCase()}</span>
        <span className="font-mono text-slate-700 dark:text-slate-200">{remaining}s</span>
      </div>

      <div className="card p-4 text-base leading-relaxed">
        <p dir={language === 'he' ? 'rtl' : 'ltr'} className="flex flex-wrap gap-2 text-slate-800 dark:text-slate-100">
          {words.map((word, idx) => {
            const status = statuses[idx];
            const base = 'rounded-md px-2 py-1 transition-colors';

            let stateClass = 'bg-slate-100/60 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100';
            if (idx === activeIndex) {
              stateClass = 'bg-brand-100 text-brand-800 dark:bg-brand-800/30 dark:text-brand-100';
            } else if (status === 'correct') {
              stateClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100';
            } else if (status === 'incorrect') {
              stateClass = 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-100';
            }

            return (
              <span key={`${word}-${idx}`} className={clsx(base, stateClass)}>
                {word}
              </span>
            );
          })}
        </p>
      </div>

      <textarea
        ref={areaRef}
        dir={language === 'he' ? 'rtl' : 'ltr'}
        className="w-full rounded-2xl border border-slate-200 bg-white p-3 font-mono text-base shadow-inner focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        rows={4}
        value={input}
        placeholder={t('start') as string}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => e.target.focus()}
      />

      <div className="flex items-center justify-between text-sm">
        <button
          className="rounded-xl bg-brand-600 px-4 py-2 text-white shadow-soft transition hover:bg-brand-500"
          onClick={() => finish()}
        >
          {t('buttons.finish')}
        </button>

        {completed && <span className="text-brand-700 dark:text-brand-300">{t('status.completed')}</span>}
      </div>
    </div>
  );
};

export default TypingTest;
