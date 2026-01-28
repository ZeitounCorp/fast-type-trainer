import { db } from '../db';
import type { LanguageCode } from '../types';

const fallbackWords: Record<LanguageCode, string[]> = {
  en: [
    'time',
    'person',
    'year',
    'way',
    'day',
    'thing',
    'man',
    'world',
    'life',
    'hand',
    'part',
    'child',
    'eye',
    'woman',
    'place',
    'work',
    'week',
    'case',
    'point',
    'government',
    'company',
    'number',
    'group',
    'problem',
    'fact',
    'learn',
    'code',
    'keyboard',
    'quick',
    'brown',
    'jump',
    'swift',
    'focus',
    'rhythm',
    'pixel',
    'matrix',
    'vector',
    'cloud',
    'ocean',
    'forest',
    'mountain',
    'valley',
    'stream',
    'river',
    'stone',
    'metal',
    'energy',
    'motion',
    'speed',
    'smooth',
    'shift',
    'track',
    'piano',
    'laser',
    'orbit',
    'neon',
    'lumen',
    'studio',
    'habit',
    'practice',
    'typing',
    'trainer',
    'level',
    'progress',
    'skill',
    'expert',
    'challenge',
    'spark',
    'glow',
    'craft',
    'focus',
    'calm',
    'steady',
    'flow',
    'streamline',
  ],
  fr: [
    'temps',
    'personne',
    'année',
    'jour',
    'monde',
    'main',
    'partie',
    'enfant',
    'femme',
    'lieu',
    'travail',
    'semaine',
    'cas',
    'point',
    'gouvernement',
    'entreprise',
    'nombre',
    'groupe',
    'problème',
    'fait',
    'apprendre',
    'code',
    'clavier',
    'rapide',
    'brun',
    'sauter',
    'rapide',
    'rythme',
    'pixel',
    'matrice',
    'vecteur',
    'nuage',
    'océan',
    'forêt',
    'montagne',
    'vallée',
    'rivière',
    'pierre',
    'métal',
    'énergie',
    'mouvement',
    'vitesse',
    'doux',
    'suivi',
    'piano',
    'laser',
    'orbite',
    'néon',
    'lumen',
    'studio',
    'habitude',
    'pratique',
    'frappe',
    'entraîneur',
    'niveau',
    'progrès',
    'compétence',
    'expert',
    'défi',
    'étincelle',
    'lueur',
    'calme',
    'régulier',
    'flux',
  ],
  he: [
    'זמן',
    'אדם',
    'שנה',
    'יום',
    'עולם',
    'יד',
    'חלק',
    'ילד',
    'אישה',
    'מקום',
    'עבודה',
    'שבוע',
    'מקרה',
    'נקודה',
    'ממשלה',
    'חברה',
    'מספר',
    'קבוצה',
    'בעיה',
    'עובדה',
    'ללמוד',
    'קוד',
    'מקלדת',
    'מהיר',
    'חום',
    'קפיצה',
    'קצב',
    'פיקסל',
    'מטריצה',
    'וקטור',
    'ענן',
    'ים',
    'יער',
    'הר',
    'עמק',
    'נהר',
    'אבן',
    'מתכת',
    'אנרגיה',
    'תנועה',
    'מהירות',
    'חלק',
    'מעקב',
    'פסנתר',
    'לייזר',
    'מסלול',
    'ניאון',
    'סטודיו',
    'הרגל',
    'אימון',
    'רמה',
    'התקדמות',
    'מיומנות',
    'מומחה',
    'אתגר',
    'ניצוץ',
    'זרימה',
  ],
};

const fetchWordFile = async (language: LanguageCode): Promise<string[]> => {
  try {
    const res = await fetch(`/wordlists/${language}.txt`);
    if (res.ok) {
      const text = await res.text();
      const items = text
        .split(/\s+|\n+/)
        .map((w) => w.trim())
        .filter(Boolean);
      if (items.length > 50) return items;
    }
  } catch (error) {
    console.warn('Wordlist fetch failed, fallback to bundled list', error);
  }
  return fallbackWords[language];
};

export const loadWords = async (language: LanguageCode): Promise<string[]> => {
  const stored = await db.wordlists.get(language);
  if (stored?.words?.length) return stored.words;
  const words = await fetchWordFile(language);
  await db.wordlists.put({ language, words, updatedAt: Date.now() });
  return words;
};

export const getRandomWords = async (
  language: LanguageCode,
  count: number,
  minLength = 3,
): Promise<string[]> => {
  const words = await loadWords(language);
  const filtered = words.filter((w) => w.length >= minLength);
  const selection: string[] = [];
  for (let i = 0; i < count; i++) {
    selection.push(filtered[Math.floor(Math.random() * filtered.length)]);
  }
  return selection;
};

export const wordsForLevel = async (
  language: LanguageCode,
  level: number,
  sessionIndex: number,
): Promise<{ words: string[]; plan: { target: number; minLength: number } }> => {
  const baseCount = 18 + level * 4;
  const extra = Math.floor(sessionIndex / 2) * 3;
  const target = baseCount + extra;
  const minLength = Math.min(10, 3 + level + Math.floor(sessionIndex / 3));
  const words = await getRandomWords(language, target, minLength);
  return { words, plan: { target, minLength } };
};
