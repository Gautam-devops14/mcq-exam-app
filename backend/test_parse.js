const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function run() {
    const buffer = fs.readFileSync('../sample_questions.pdf');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    console.log(result.text);
}
run().catch(console.error);
