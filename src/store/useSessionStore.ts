import { create } from 'zustand';
import type { TrainingPlan, TypingResult } from '../types';

interface SessionState {
  activePlan?: TrainingPlan;
  isRunning: boolean;
  elapsedMs: number;
  words: string[];
  currentIndex: number;
  typed: string;
  startedAt?: number;
  setPlan: (plan?: TrainingPlan) => void;
  start: (words: string[]) => void;
  stop: () => void;
  advance: (newIndex: number) => void;
  setTyped: (text: string) => void;
  setElapsed: (ms: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isRunning: false,
  elapsedMs: 0,
  words: [],
  currentIndex: 0,
  typed: '',
  setPlan: (activePlan) => set({ activePlan }),
  start: (words) =>
    set({
      words,
      isRunning: true,
      elapsedMs: 0,
      startedAt: performance.now(),
      currentIndex: 0,
      typed: '',
    }),
  stop: () =>
    set({
      isRunning: false,
    }),
  advance: (newIndex) => set({ currentIndex: newIndex }),
  setTyped: (typed) => set({ typed }),
  setElapsed: (elapsedMs) => set({ elapsedMs }),
}));

export const summarizeResult = (
  state: Pick<SessionState, 'words' | 'currentIndex' | 'elapsedMs'>,
  typedChars: number,
  errors: number,
): TypingResult => {
  const minutes = Math.max(state.elapsedMs / 60000, 0.01);
  const wordsTyped = state.currentIndex;
  const wpm = Math.round((wordsTyped / minutes) * 100) / 100;
  const cps = Math.round((typedChars / (state.elapsedMs / 1000)) * 100) / 100;
  const accuracy = Math.max(0, Math.round(((typedChars - errors) / typedChars) * 100));

  return {
    wpm,
    cps,
    accuracy,
    wordsTyped,
    correctWords: Math.max(0, wordsTyped - errors),
    errors,
    elapsedMs: state.elapsedMs,
    wrongWords: [],
  };
};
