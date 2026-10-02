const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

indexTs = indexTs.replace("const { PdfReader } = require('pdfreader');", "const PDFParser = require('pdf2json');");

const helper = `
async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        resolve(pdfParser.getRawTextContent());
    });
    pdfParser.parseBuffer(buffer);
  });
}
`;

// Replace the old parsePDFBuffer function
indexTs = indexTs.replace(/async function parsePDFBuffer[\s\S]*?\}\n\}/, helper);

fs.writeFileSync('backend/src/index.ts', indexTs);
