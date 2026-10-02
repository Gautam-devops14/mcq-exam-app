const fs = require('fs');
const PDFParser = require("pdf2json");

async function parsePDF(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(this, 1);
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(buffer);
    });
}

async function run() {
  const buffer = fs.readFileSync('dummy.pdf');
  const text = await parsePDF(buffer);
  console.log(text);
}
run();
