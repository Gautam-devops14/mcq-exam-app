const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');
code = code.replace("const pdfParse = require('pdf-parse');", "import { PDFParse } from 'pdf-parse';");
code = code.replace("const data = await pdfParse(dataBuffer);", "const parser = new PDFParse({ data: dataBuffer });\n    const data = await parser.getText();");
fs.writeFileSync('backend/src/index.ts', code);
