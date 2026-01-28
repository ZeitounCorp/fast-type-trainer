import { useSettingsStore } from '../store/useSettingsStore';
import type { LanguageCode } from '../types';
import i18n from 'i18next';

const languageLabels: Record<LanguageCode, string> = {
  en: 'English',
  fr: 'Français',
  he: 'עברית',
};

const LanguageSelector = () => {
  const { interfaceLanguage, setInterfaceLanguage } = useSettingsStore();

  const handleChange = (lang: LanguageCode) => {
    setInterfaceLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  };

  return (
    <select
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
      value={interfaceLanguage}
      onChange={(e) => handleChange(e.target.value as LanguageCode)}
    >
      {Object.entries(languageLabels).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;
