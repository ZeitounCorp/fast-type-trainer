import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getProfile, saveProfile, logSession } from './db';
import OnboardingWizard from './components/OnboardingWizard';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import StatsStrip from './components/StatsStrip';
import TypingTest from './components/TypingTest';
import ProgressCharts from './components/ProgressCharts';
import ImportExport from './components/ImportExport';
import AboutWordlists from './components/AboutWordlists';
import type { TrainingPlan, UserProfile, LanguageCode } from './types';
import { aggregateStats } from './utils/metrics';
import { wordsForLevel, getRandomWords } from './utils/wordLoader';
import { useSettingsStore } from './store/useSettingsStore';
import { ArrowPathIcon, BoltIcon, PlayIcon } from '@heroicons/react/24/solid';
import { levelFromWpm, levelLabel } from './types';
import clsx from 'clsx';

type View = 'dashboard' | 'training' | 'custom' | 'settings';

const navItems = (t: (k: string, opts?: Record<string, unknown>) => string): {
  id: View;
  label: string;
  icon: ReactNode;
}[] => [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <BoltIcon className="h-4 w-4" /> },
    { id: 'training', label: t('nav.guided'), icon: <PlayIcon className="h-4 w-4" /> },
    { id: 'custom', label: t('nav.custom'), icon: <ArrowPathIcon className="h-4 w-4" /> },
    { id: 'settings', label: t('nav.settings'), icon: <span className="h-4 w-4">⚙️</span> },
  ];

const App = () => {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => getProfile(), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const [view, setView] = useState<View>('dashboard');
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [testResult, setTestResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const { preferredTypingLanguages } = useSettingsStore();
  const [customConfig, setCustomConfig] = useState(() => ({
    language: (preferredTypingLanguages[0] ?? 'en') as LanguageCode,
    count: 25,
    minLength: 4,
    duration: 90,
  }));

  const stats = useMemo(() => aggregateStats(sessions ?? []), [sessions]);

  const startGuidedSession = async () => {
    if (!profile) return;
    const sessionIndex = profile.xp % 10;
    const language = profile.typingLanguages[0] ?? 'en';
    const { words: generated, plan } = await wordsForLevel(language, profile.level, sessionIndex);
    setActivePlan({
      targetWords: plan.target,
      minLength: plan.minLength,
      language,
      difficulty: plan.minLength > 7 ? 'hard' : plan.minLength > 5 ? 'medium' : 'easy',
      mode: 'guided',
    });
    setWords(generated);
    setView('training');
  };

  const startCustomSession = async () => {
    const generated = await getRandomWords(customConfig.language, customConfig.count, customConfig.minLength);
    setActivePlan({
      targetWords: customConfig.count,
      minLength: customConfig.minLength,
      language: customConfig.language,
      difficulty: customConfig.minLength > 7 ? 'hard' : customConfig.minLength > 5 ? 'medium' : 'easy',
      mode: 'custom',
    });
    setWords(generated);
    setView('custom');
  };

  const handleResult = async (
    wpm: number,
    accuracy: number,
    mode: 'guided' | 'custom' | 'assessment',
    wordsTyped: number,
    correctWords: number,
    errors: number,
    cps: number,
    wrongWords: string[],
  ) => {
    if (!profile) return;
    const xpGain = mode === 'guided' || mode === 'assessment' ? 1 : 0;
    const nextXp = profile.xp + xpGain;
    const leveledUp = nextXp >= 10 && profile.level < 5;
    const sessionCount = sessions?.length ?? 0;
    const accuracyAvg = Math.round(
      ((stats.accuracyAvg || 0) * sessionCount + accuracy) / Math.max(sessionCount + 1, 1),
    );
    const updatedProfile: UserProfile = {
      ...profile,
      xp: leveledUp ? 0 : nextXp,
      level: leveledUp ? profile.level + 1 : profile.level,
      bestWpm: Math.max(profile.bestWpm, wpm),
      accuracyAvg,
    };

    await logSession({
      profileId: 'main',
      date: Date.now(),
      language: activePlan?.language ?? profile.typingLanguages[0] ?? 'en',
      wordsTyped,
      correctWords,
      errors,
      wpm,
      cps,
      accuracy,
      levelAtRun: profile.level,
      mode,
      wrongWords,
    });
    await saveProfile(updatedProfile);
  };

  const dashboard = profile && (
    <div className="space-y-4">
      <StatsStrip
        stats={[
          { label: t('stats.level'), value: `${profile.level} · ${levelLabel(profile.level)}` },
          { label: t('stats.xp'), value: `${profile.xp}/10`, hint: '10 sessions to level up' },
          { label: t('stats.best'), value: `${profile.bestWpm}` },
          { label: t('stats.accuracyAvg'), value: `${stats.accuracyAvg}%` },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{t('stats.recent')}</p>
            <button
              onClick={startGuidedSession}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white shadow-soft hover:bg-brand-500"
            >
              {t('buttons.startGuided')}
            </button>
          </div>
          <div className="space-y-2">
            {(sessions ?? [])
              .slice()
              .sort((a, b) => b.date - a.date)
              .slice(0, 5)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {levelLabel(s.levelAtRun)} · {s.mode}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(s.date).toLocaleDateString()} · {s.language.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-4 text-right text-xs">
                    <span className="font-semibold text-brand-700 dark:text-brand-300">
                      {s.wpm} {t('metrics.wpm')}
                    </span>
                    <span>{s.accuracy}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="card flex flex-col gap-3 p-4">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{t('stats.nextMilestone')}</p>
          <p className="text-sm text-slate-500">
            {t('stats.completeToLevel', { remaining: 10 - profile.xp, nextLevel: profile.level + 1 })}
          </p>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${(profile.xp / 10) * 100}%` }}
            />
          </div>
          <button
            onClick={startGuidedSession}
            className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-brand-700 transition hover:border-brand-300 dark:border-brand-700/60 dark:bg-brand-900/30 dark:text-brand-100"
          >
            {t('stats.guidedButton')}
          </button>
          <button
            onClick={() => setView('settings')}
            className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:border-brand-200 dark:border-slate-700 dark:text-slate-100"
          >
            {t('stats.settings')}
          </button>
        </div>
      </div>
      <ProgressCharts sessions={sessions ?? []} />
    </div>
  );

  const guidedSection =
    view === 'training'
      ? activePlan
        ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('modes.guided')} · {t('stats.level')} {profile?.level}</p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {activePlan.language.toUpperCase()} · {activePlan.targetWords} {t('customSection.count')}
                </h2>
              </div>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                {activePlan.difficulty}
              </span>
            </div>
            <TypingTest
              words={words}
              language={activePlan.language}
              durationSeconds={60}
              onFinish={(res) => {
                setTestResult({ wpm: res.wpm, accuracy: res.accuracy })
                handleResult(
                  res.wpm,
                  res.accuracy,
                  'guided',
                  res.wordsTyped,
                  res.correctWords,
                  res.errors,
                  res.cps,
                  res.wrongWords,
                );
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
          </div>
        )
        : (
          <div className="card p-4">
            <p className="text-sm text-slate-500">No active session</p>
            <button
              className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-white shadow-soft transition hover:bg-brand-500"
              onClick={startGuidedSession}
            >
              {t('buttons.startGuided')}
            </button>
          </div>
        )
      : null;

  const customSection =
    view === 'custom' ? (
      <div className="space-y-4">
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <label className="flex flex-col text-sm">
            {t('customSection.language')}
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={customConfig.language}
              onChange={(e) => setCustomConfig({ ...customConfig, language: e.target.value as LanguageCode })}
            >
              {['en', 'fr', 'he'].map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            {t('customSection.count')}
            <input
              type="number"
              className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={customConfig.count}
              min={10}
              max={200}
              onChange={(e) => setCustomConfig({ ...customConfig, count: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col text-sm">
            {t('customSection.minLength')}
            <input
              type="number"
              className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={customConfig.minLength}
              min={3}
              max={12}
              onChange={(e) => setCustomConfig({ ...customConfig, minLength: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col text-sm">
            {t('customSection.duration')}
            <input
              type="number"
              className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={customConfig.duration}
              min={15}
              max={300}
              onChange={(e) => setCustomConfig({ ...customConfig, duration: Number(e.target.value) })}
            />
          </label>
          <button
            onClick={startCustomSession}
            className="rounded-xl bg-brand-600 px-4 py-2 text-white shadow-soft transition hover:bg-brand-500"
          >
            Generate
          </button>
        </div>
        {activePlan?.mode === 'custom' && (
          <TypingTest
            words={words}
            language={activePlan.language}
            durationSeconds={customConfig.duration}
            onFinish={(res) => {
              setTestResult({ wpm: res.wpm, accuracy: res.accuracy });
              return handleResult(
                res.wpm,
                res.accuracy,
                'custom',
                res.wordsTyped,
                res.correctWords,
                res.errors,
                res.cps,
                res.wrongWords,
              );
            }}
          />
        )}
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
      </div>
    ) : null;

  const settingsSection =
    view === 'settings' ? (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{t('settingsPage.theme')}</p>
          <ThemeToggle />
        </div>
        <div className="card space-y-3 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{t('settingsPage.interfaceLang')}</p>
          <LanguageSelector />
        </div>
        <ImportExport />
        <AboutWordlists />
      </div>
    ) : null;

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <OnboardingWizard
          onCompleted={() => {
            setView('dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 md:px-6">
      <div className="mx-auto w-full space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
              ⌨️
            </div>
            <div>
              <h1 className="text-xl font-semibold">{t('appTitle')}</h1>
              <p className="text-xs text-slate-500">
                {t('subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          {navItems(t).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={clsx(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                view === item.id
                  ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm dark:border-brand-700 dark:bg-brand-900/40 dark:text-brand-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {view === 'dashboard' && dashboard}
        {guidedSection}
        {customSection}
        {settingsSection}
      </div>
    </div>
  );
};

export default App;
