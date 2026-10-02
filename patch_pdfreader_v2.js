const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

indexTs = indexTs.replace(/const data = await pdfParse\(dataBuffer\);\s*const text = data\.text;/g, "const text = await parsePDFBuffer(dataBuffer);");

fs.writeFileSync('backend/src/index.ts', indexTs);
