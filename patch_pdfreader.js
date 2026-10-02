const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// Replace pdf-parse import with pdfreader
indexTs = indexTs.replace("import pdfParse from 'pdf-parse';", "const { PdfReader } = require('pdfreader');");

// Add helper function
const helper = `
async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = '';
    new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
      if (err) reject(err);
      else if (!item) resolve(text);
      else if (item.text) text += item.text + '\\n';
    });
  });
}
`;
indexTs = indexTs.replace("import crypto from 'crypto';", "import crypto from 'crypto';\n" + helper);

// Replace pdfParse(dataBuffer) with parsePDFBuffer(dataBuffer)
indexTs = indexTs.replace(/const data = await pdfParse\(dataBuffer\);\n\s*const text = data\.text;/g, 
"const text = await parsePDFBuffer(dataBuffer);");

fs.writeFileSync('backend/src/index.ts', indexTs);
