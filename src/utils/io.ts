import { db } from '../db';

export const exportData = async () => {
  const [profiles, sessions, wordlists] = await Promise.all([
    db.profiles.toArray(),
    db.sessions.toArray(),
    db.wordlists.toArray(),
  ]);
  const blob = new Blob([JSON.stringify({ profiles, sessions, wordlists }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fast-type-export.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);
  await db.transaction('rw', [db.profiles, db.sessions, db.wordlists], async () => {
    await db.profiles.clear();
    await db.sessions.clear();
    await db.wordlists.clear();
    if (Array.isArray(data.profiles)) await db.profiles.bulkAdd(data.profiles);
    if (Array.isArray(data.sessions)) await db.sessions.bulkAdd(data.sessions);
    if (Array.isArray(data.wordlists)) await db.wordlists.bulkAdd(data.wordlists);
  });
};
