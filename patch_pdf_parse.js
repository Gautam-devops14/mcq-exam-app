const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// Replace imports
indexTs = indexTs.replace("import { PDFParse } from 'pdf-parse';", "const pdfParse = require('pdf-parse');");

// Replace usage in /api/exams/create
indexTs = indexTs.replace("const parser = new PDFParse({ data: dataBuffer });\n    const data = await parser.getText();", "const data = await pdfParse(dataBuffer);");

// Replace usage in /api/exams/upload-key
indexTs = indexTs.replace("const parser = new PDFParse({ data: dataBuffer });\n    const data = await parser.getText();", "const data = await pdfParse(dataBuffer);");

fs.writeFileSync('backend/src/index.ts', indexTs);
