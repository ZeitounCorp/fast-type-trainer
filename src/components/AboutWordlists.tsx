import { useEffect, useState } from 'react';
import type { LanguageCode } from '../types';
import { useTranslation } from 'react-i18next';

type Count = { language: LanguageCode; count: number; loaded: boolean };

const langs: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'he', label: 'עברית' },
];

const AboutWordlists = () => {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Record<LanguageCode, Count>>({
    en: { language: 'en', count: 0, loaded: false },
    fr: { language: 'fr', count: 0, loaded: false },
    he: { language: 'he', count: 0, loaded: false },
  });

  useEffect(() => {
    langs.forEach(async (lang) => {
      try {
        const res = await fetch(`/wordlists/${lang.code}.txt`);
        const text = await res.text();
        const words = text.split(/\s+|\n+/).filter(Boolean);
        setCounts((prev) => ({
          ...prev,
          [lang.code]: { language: lang.code, count: words.length, loaded: true },
        }));
      } catch (err) {
        console.error('Wordlist load failed', err);
      }
    });
  }, []);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{t('aboutWordlists.title')}</p>
        <span className="text-xs text-slate-500">{t('aboutWordlists.cached')}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {langs.map((lang) => {
          const info = counts[lang.code];
          return (
            <div
              key={lang.code}
              className="rounded-xl border border-slate-200 bg-white/70 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{lang.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                  {lang.code.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {info.loaded ? `${info.count.toLocaleString()} ${t('settingsPage.wordCount')}` : '…'}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        {t('aboutWordlists.description')}
      </p>
    </div>
  );
};

export default AboutWordlists;
