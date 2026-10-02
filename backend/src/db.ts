import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./mcq.db');

export const run = (sql: string, params: any[] = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const get = (sql: string, params: any[] = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export const all = (sql: string, params: any[] = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
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
      answerKey JSON,
      questions JSON,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examCode TEXT,
      name TEXT,
      answers JSON,
      status TEXT DEFAULT 'IN_PROGRESS',
      score INTEGER,
      totalCorrect INTEGER,
      totalWrong INTEGER,
      totalUnanswered INTEGER
    )
  `);
};
