import { useRef, useState } from 'react';
import { exportData, importData } from '../utils/io';
import { useTranslation } from 'react-i18next';

const ImportExport = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleImport = async (file: File) => {
    try {
      await importData(file);
      setStatus(t('importExport.success'));
    } catch (err) {
      console.error(err);
      setStatus(t('importExport.error'));
    }
  };

  return (
    <div className="card flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{t('importExport.title')}</p>
        <div className="text-xs text-slate-500">{t('importExport.subtitle')}</div>
      </div>
      <div className="flex gap-3">
        <button
          className="rounded-xl bg-brand-600 px-4 py-2 text-white shadow-soft transition hover:bg-brand-500"
          onClick={exportData}
        >
          {t('export')}
        </button>
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:text-slate-100"
          onClick={() => inputRef.current?.click()}
        >
          {t('import')}
        </button>
        <input
          type="file"
          accept="application/json"
          hidden
          ref={inputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
        />
      </div>
      {status && <p className="text-xs text-slate-500">{status}</p>}
    </div>
  );
};

export default ImportExport;
