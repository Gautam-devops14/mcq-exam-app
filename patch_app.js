const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

const missingInit = `import { initDb, get, run } from './db';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

initDb().then(() => console.log('Database initialized'));
`;

// It seems I accidentally deleted these! I will inject them back after the imports.
indexTs = indexTs.replace("import crypto from 'crypto';", "import crypto from 'crypto';\n\n" + missingInit);

// Wait, I also need to remove the broken pdf2json code that was left behind!
indexTs = indexTs.replace(/const PDFParser = require\('pdf2json'\);\s*async function parsePDFBuffer[\s\S]*?\}\n\);\n/, "");

fs.writeFileSync('backend/src/index.ts', indexTs);
