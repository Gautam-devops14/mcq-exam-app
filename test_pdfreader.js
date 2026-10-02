const { PdfReader } = require('pdfreader');
const fs = require('fs');

async function parsePDF(buffer) {
  return new Promise((resolve, reject) => {
    let text = '';
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) reject(err);
      else if (!item) resolve(text);
      else if (item.text) text += item.text + '\n';
    });
  });
}

async function run() {
  const buffer = fs.readFileSync('dummy.pdf');
  const text = await parsePDF(buffer);
  console.log(text);
}
run();
