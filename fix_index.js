const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

if (!indexTs.includes('const port =')) {
  indexTs = indexTs.replace("const app = express();", "const app = express();\nconst port = process.env.PORT || 5000;");
}

fs.writeFileSync('backend/src/index.ts', indexTs);
