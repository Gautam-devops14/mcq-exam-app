const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('dummy.pdf'));
doc.fontSize(25).text('Questions:\n1. What is 2+2?\nA) 4\nB) 5\nC) 6\nD) 7\nAnswer: A', 100, 100);
doc.end();
