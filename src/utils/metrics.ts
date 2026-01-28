import type { Session, TypingResult } from '../types';

export const computeTypingMetrics = (
  typed: string,
  targetWords: string[],
  startTime: number,
  endTime: number,
): TypingResult => {
  const elapsedMs = Math.max(endTime - startTime, 1);
  const typedWords = typed.trim().split(/\s|\n+/).filter(Boolean);
  const errors = typedWords.reduce((acc, word, idx) => {
    const target = targetWords[idx] ?? '';
    if (word !== target) {
      return acc + Math.abs(word.length - target.length || 1);
    }
    return acc;
  }, 0);
  const chars = typed.replace(/\s|\n+/g, '').length;
  const minutes = elapsedMs / 60000;
  const wpm = Math.round((typedWords.length / minutes) * 100) / 100;
  const cps = Math.round((chars / (elapsedMs / 1000)) * 100) / 100;
  const accuracy = chars ? Math.max(0, Math.round(((chars - errors) / chars) * 100)) : 0;
  return {
    wpm,
    cps,
    accuracy,
    wordsTyped: typedWords.length,
    correctWords: Math.max(0, typedWords.length - errors),
    errors,
    elapsedMs,
    wrongWords: [],
  };
};

export const aggregateStats = (sessions: Session[]) => {
  if (!sessions.length) return { bestWpm: 0, accuracyAvg: 0 };
  const bestWpm = Math.max(...sessions.map((s) => s.wpm));
  const accuracyAvg = Math.round(
    sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length,
  );
  return { bestWpm, accuracyAvg };
};
