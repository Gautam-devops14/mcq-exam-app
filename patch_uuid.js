const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// Replace import { v4 as uuidv4 } from 'uuid';
// with import crypto from 'crypto';
indexTs = indexTs.replace("import { v4 as uuidv4 } from 'uuid';", "import crypto from 'crypto';");

// Replace uuidv4() with crypto.randomUUID()
indexTs = indexTs.replace(/uuidv4\(\)/g, "crypto.randomUUID()");

fs.writeFileSync('backend/src/index.ts', indexTs);
