import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { saveProfile } from '../db';
import type { KeyboardLayout, LanguageCode, UserProfile } from '../types';
import { levelFromWpm, levelLabel } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { getRandomWords } from '../utils/wordLoader';
import TypingTest from './TypingTest';

type Props = {
  onCompleted: (profile: UserProfile) => void;
};

const typingLanguageOptions: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'he', label: 'עברית' },
];

const steps = [
  { id: 0, label: 'Language' },
  { id: 1, label: 'Typing Languages' },
  { id: 2, label: 'Skill Test' },
];

const OnboardingWizard = ({ onCompleted }: Props) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [keyboardLayout] = useState<KeyboardLayout>('qwerty');
  const [testWords, setTestWords] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const {
    interfaceLanguage,
    setInterfaceLanguage,
    preferredTypingLanguages,
    setPreferredTypingLanguages,
  } = useSettingsStore();

  useEffect(() => {
    document.documentElement.dir = interfaceLanguage === 'he' ? 'rtl' : 'ltr';
    i18n.changeLanguage(interfaceLanguage);
  }, [interfaceLanguage, i18n]);

  const fetchWords = async () => {
    const words = await getRandomWords(preferredTypingLanguages[0] ?? 'en', 15, 4);
    setTestWords(words);
  };

  useEffect(() => {
    fetchWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredTypingLanguages]);

  const finish = async () => {
    const baseProfile: UserProfile = {
      id: 'main',
      typingLanguages: preferredTypingLanguages,
      keyboardLayout,
      level: levelFromWpm(testResult?.wpm ?? 0),
      xp: 0,
      bestWpm: testResult?.wpm ?? 0,
      accuracyAvg: testResult?.accuracy ?? 0,
      createdAt: Date.now(),
    };
    await saveProfile(baseProfile);
    onCompleted(baseProfile);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-2 sm:px-4">
      <div className="card p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">{t('onboarding.welcome')}</p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {t('appTitle')}
            </h1>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
              {t('onboarding.stepLabel', { current: step + 1, total: 3 })}
            </div>
            <div className="mt-2 flex gap-1">
              {steps.map((s) => (
                <span
                  key={s.id}
                  className={`h-2 w-10 rounded-full transition ${
                    step >= s.id ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t('onboarding.interface')}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {typingLanguageOptions.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setInterfaceLanguage(opt.code)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    interfaceLanguage === opt.code
                      ? 'border-brand-400 bg-brand-50 shadow-soft dark:border-brand-700 dark:bg-brand-900/30'
                      : 'border-slate-200 bg-white hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  <div className="text-base font-semibold">{opt.label}</div>
                  <div className="text-xs text-slate-500">UI</div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('onboarding.tipInterface')}</span>
              <button
                className="rounded-xl bg-brand-600 px-5 py-2 text-white shadow-soft transition hover:bg-brand-500"
                onClick={() => setStep(1)}
              >
                {t('buttons.continue')}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t('onboarding.typingLanguages')}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {typingLanguageOptions.map((opt) => {
                const active = preferredTypingLanguages.includes(opt.code);
                return (
                  <label
                    key={opt.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      active
                        ? 'border-brand-400 bg-brand-50 shadow-soft dark:border-brand-700 dark:bg-brand-900/30'
                        : 'border-slate-200 bg-white hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferredTypingLanguages([...preferredTypingLanguages, opt.code]);
                        } else {
                          setPreferredTypingLanguages(
                            preferredTypingLanguages.filter((l) => l !== opt.code),
                          );
                        }
                      }}
                    />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('onboarding.selectMultiple')}</span>
              <div className="flex gap-2">
                <button
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:text-slate-100"
                  onClick={() => setStep(0)}
                >
                  {t('buttons.back')}
                </button>
                <button
                  className="rounded-xl bg-brand-600 px-5 py-2 text-white shadow-soft transition hover:bg-brand-500"
                  onClick={() => setStep(2)}
                >
                  {t('buttons.continue')}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t('onboarding.test')}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{t('onboarding.mediumTest')}</span>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 hover:border-brand-300 dark:border-slate-700"
                onClick={fetchWords}
              >
                {t('onboarding.regenerate')}
              </button>
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                {preferredTypingLanguages[0]?.toUpperCase() ?? 'EN'}
              </span>
            </div>
            <TypingTest
              words={testWords}
              durationSeconds={45}
              language={preferredTypingLanguages[0] ?? 'en'}
              onFinish={(metrics) => {
                setTestResult({ wpm: metrics.wpm, accuracy: metrics.accuracy });
              }}
            />
              {testResult && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-brand-800 dark:border-brand-700/60 dark:bg-brand-900/30 dark:text-brand-100">
                  <p className="font-semibold">
                    Level {levelFromWpm(testResult.wpm)} · {levelLabel(levelFromWpm(testResult.wpm))}
                  </p>
                  <p className="text-sm">WPM: {testResult.wpm} · Accuracy: {testResult.accuracy}%</p>
                <p className="text-xs text-brand-700/80 dark:text-brand-200/80">
                  {t('onboarding.retake')}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('onboarding.finishHint')}</span>
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:text-slate-100"
                onClick={() => setStep(1)}
              >
                {t('buttons.back')}
              </button>
              <button
                disabled={!testResult}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-white shadow-soft transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={finish}
              >
                {t('onboarding.finish')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
