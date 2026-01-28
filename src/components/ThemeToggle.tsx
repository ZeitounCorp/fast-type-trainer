import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

const ThemeToggle = () => {
  const { theme, setTheme } = useSettingsStore();

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', media.matches);
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/70 px-2 py-1 text-sm dark:bg-slate-800/70">
      <button
        className={`rounded-full px-3 py-1 transition ${
          theme === 'light' ? 'bg-white shadow-sm dark:bg-slate-700' : ''
        }`}
        onClick={() => setTheme('light')}
      >
        ☀️
      </button>
      <button
        className={`rounded-full px-3 py-1 transition ${
          theme === 'system' ? 'bg-white shadow-sm dark:bg-slate-700' : ''
        }`}
        onClick={() => setTheme('system')}
      >
        🖥️
      </button>
      <button
        className={`rounded-full px-3 py-1 transition ${
          theme === 'dark' ? 'bg-white shadow-sm dark:bg-slate-700' : ''
        }`}
        onClick={() => setTheme('dark')}
      >
        🌙
      </button>
    </div>
  );
};

export default ThemeToggle;
