const fs = require('fs');

// 1. Refactor db.ts for Turso
const dbTs = `
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
  await run(\`
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
  \`);

  await run(\`
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
  \`);
};
`;
fs.writeFileSync('backend/src/db.ts', dbTs);

// 2. Refactor index.ts to export app and use /tmp for multer
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// replace multer dest
indexTs = indexTs.replace("const upload = multer({ dest: 'uploads/' });", "import os from 'os';\nconst upload = multer({ dest: os.tmpdir() });");

// replace app.listen
indexTs = indexTs.replace(/app\.listen\(port, \(\) => \{\s*console\.log\(`Backend running on http:\/\/localhost:\$\{port\}`\);\s*\}\);/, `
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(\`Backend running on http://localhost:\$\{port\}\`);
  });
}
export default app;
`);

fs.writeFileSync('backend/src/index.ts', indexTs);

// 3. Create vercel.json
const vercelJson = {
  "version": 2,
  "builds": [
    {
      "src": "backend/src/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/vite"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/src/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/frontend/$1"
    }
  ]
};
fs.writeFileSync('vercel.json', JSON.stringify(vercelJson, null, 2));

