export type LanguageCode = 'en' | 'fr' | 'he';

export type ThemeMode = 'light' | 'dark' | 'system';

export type KeyboardLayout = 'qwerty' | 'azerty' | 'hebrew' | 'unknown';

export interface UserProfile {
  id: string;
  typingLanguages: LanguageCode[];
  keyboardLayout: KeyboardLayout;
  level: number;
  xp: number;
  bestWpm: number;
  accuracyAvg: number;
  createdAt: number;
}

export interface Session {
  id?: number;
  profileId: string;
  date: number;
  language: LanguageCode;
  wordsTyped: number;
  correctWords: number;
  errors: number;
  wpm: number;
  cps: number;
  accuracy: number;
  levelAtRun: number;
  mode: 'guided' | 'custom' | 'assessment';
  wrongWords: string[];
}

export interface WordList {
  language: LanguageCode;
  words: string[];
  updatedAt: number;
}

export interface TypingResult {
  wpm: number;
  cps: number;
  accuracy: number;
  wordsTyped: number;
  correctWords: number;
  errors: number;
  elapsedMs: number;
  wrongWords: string[];
}

export interface TrainingPlan {
  targetWords: number;
  minLength: number;
  language: LanguageCode;
  difficulty: 'easy' | 'medium' | 'hard';
  mode: 'guided' | 'custom';
}

export const levelFromWpm = (wpm: number): number => {
  if (wpm < 20) return 1;
  if (wpm < 35) return 2;
  if (wpm < 50) return 3;
  if (wpm < 70) return 4;
  return 5;
};

export const levelLabel = (level: number): string => {
  switch (level) {
    case 1:
      return 'Beginner';
    case 2:
      return 'Basic';
    case 3:
      return 'Intermediate';
    case 4:
      return 'Advanced';
    default:
      return 'Expert';
  }
};
