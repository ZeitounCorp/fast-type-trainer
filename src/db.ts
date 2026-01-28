import Dexie, { type Table } from 'dexie';
import type { Session, UserProfile, WordList } from './types';

class FastTypeDB extends Dexie {
  profiles!: Table<UserProfile, string>;
  sessions!: Table<Session, number>;
  wordlists!: Table<WordList, string>;

  constructor() {
    super('fast-type-trainer');
    this.version(1).stores({
      profiles: 'id, createdAt',
      sessions: '++id, profileId, date, language, levelAtRun',
      wordlists: 'language, updatedAt',
    });
    this.version(2)
      .stores({
        profiles: 'id, createdAt',
        sessions: '++id, profileId, date, language, levelAtRun',
        wordlists: 'language, updatedAt',
      })
      .upgrade((tx) =>
        tx.table<Session>('sessions').toCollection().modify((s) => {
          s.correctWords = s.correctWords ?? s.wordsTyped ?? 0;
          s.wrongWords = s.wrongWords ?? [];
        }),
      );
  }
}

export const db = new FastTypeDB();

export const getProfile = async (): Promise<UserProfile | undefined> =>
  db.profiles.get('main');

export const saveProfile = async (profile: UserProfile) =>
  db.profiles.put({ ...profile, id: 'main' });

export const clearAll = async () => {
  await db.transaction('rw', [db.profiles, db.sessions, db.wordlists], async () => {
    await db.profiles.clear();
    await db.sessions.clear();
    await db.wordlists.clear();
  });
};

export const logSession = async (session: Omit<Session, 'id'>) => {
  await db.sessions.add(session);
};
