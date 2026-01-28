import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';
import { useSettingsStore } from './store/useSettingsStore';
import { registerSW } from 'virtual:pwa-register';
import i18n from 'i18next';

const ThemeInitializer = () => {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    root.classList.toggle('dark', effective === 'dark');
    document.body.style.setProperty('--bg', effective === 'dark' ? '#0b1220' : '#f8fafc');
    document.body.style.setProperty('--fg', effective === 'dark' ? '#e2e8f0' : '#0f172a');
  }, [theme]);

  return null;
};

const LanguageInitializer = () => {
  const lang = useSettingsStore((s) => s.interfaceLanguage);

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [lang]);

  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeInitializer />
    <LanguageInitializer />
    <App />
  </StrictMode>,
);

registerSW({ immediate: true });
