import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LanguageCode, ThemeMode } from '../types';

interface SettingsState {
  theme: ThemeMode;
  interfaceLanguage: LanguageCode;
  preferredTypingLanguages: LanguageCode[];
  setTheme: (theme: ThemeMode) => void;
  setInterfaceLanguage: (lang: LanguageCode) => void;
  setPreferredTypingLanguages: (langs: LanguageCode[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      interfaceLanguage: 'en',
      preferredTypingLanguages: ['en'],
      setTheme: (theme) => set({ theme }),
      setInterfaceLanguage: (interfaceLanguage) => set({ interfaceLanguage }),
      setPreferredTypingLanguages: (preferredTypingLanguages) =>
        set({ preferredTypingLanguages }),
    }),
    {
      name: 'fast-type-settings',
    },
  ),
);
