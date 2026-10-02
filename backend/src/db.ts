
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./mcq.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const run = async (sql: string, params: any[] = []) => {
  return await client.execute({ sql, args: params });
};

export const get = async (sql: string, params: any[] = []) => {
  const result = await client.execute({ sql, args: params });
  return result.rows[0];
};

export const all = async (sql: string, params: any[] = []) => {
  const result = await client.execute({ sql, args: params });
  return result.rows;
};

export const initDb = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS exams (
      examCode TEXT PRIMARY KEY,
      adminToken TEXT,
      name TEXT,
      duration INTEGER,
      numQuestions INTEGER,
      status TEXT DEFAULT 'OPEN',
      answerKey TEXT,
      questions TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examCode TEXT,
      name TEXT,
      answers TEXT,
      status TEXT DEFAULT 'IN_PROGRESS',
      score INTEGER,
      totalCorrect INTEGER,
      totalWrong INTEGER,
      totalUnanswered INTEGER
    )
  `);
};
