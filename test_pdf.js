const fs = require('fs');
const pdfParse = require('pdf-parse');
async function run() {
  try {
    const dataBuffer = fs.readFileSync('dummy.pdf');
    const base64 = dataBuffer.toString('base64');
    const newBuffer = Buffer.from(base64, 'base64');
    const data = await pdfParse(newBuffer);
    console.log(data.text);
  } catch(e) {
    console.error("FAIL:", e);
  }
}
run();
