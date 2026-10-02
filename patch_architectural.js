const fs = require('fs');

// 1. Patch CreateExam.tsx
let createTs = fs.readFileSync('frontend/src/pages/CreateExam.tsx', 'utf8');
createTs = `import { extractTextFromPDF } from '../utils/pdfExtractor';\n` + createTs;

const createRegex = /const reader = new FileReader\(\);.*?headers: \{ 'Content-Type': 'application\/json' \}\s*\}\);/s;
const createReplacement = `const extractedText = await extractTextFromPDF(selectedFile);
      const response = await axios.post(\`\${API_URL}/exams/create\`, { 
        extractedText,
        examName,
        duration: Number(duration),
        numQuestions: Number(numQuestions)
      }, {
        headers: { 'Content-Type': 'application/json' }
      });`;
createTs = createTs.replace(createRegex, createReplacement);
fs.writeFileSync('frontend/src/pages/CreateExam.tsx', createTs);


// 2. Patch OrganizerPanel.tsx
let orgTs = fs.readFileSync('frontend/src/pages/OrganizerPanel.tsx', 'utf8');
orgTs = `import { extractTextFromPDF } from '../utils/pdfExtractor';\n` + orgTs;

const orgRegex = /const reader = new FileReader\(\);.*?headers: \{ 'Content-Type': 'application\/json' \}\s*\}\);/s;
const orgReplacement = `const extractedText = await extractTextFromPDF(selectedFile);
      const response = await axios.post(\`\${API_URL}/exams/\${exam.examCode}/upload-key\`, { 
        extractedText
      }, {
        headers: { 'Content-Type': 'application/json' }
      });`;
orgTs = orgTs.replace(orgRegex, orgReplacement);
fs.writeFileSync('frontend/src/pages/OrganizerPanel.tsx', orgTs);


// 3. Patch backend to receive extractedText and remove PDF parsers entirely!
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');
indexTs = indexTs.replace("const PDFParser = require('pdf2json');\n\nasync function parsePDFBuffer(buffer: Buffer): Promise<string> {\n  return new Promise((resolve, reject) => {\n    const pdfParser = new PDFParser(this, 1);\n    pdfParser.on(\"pdfParser_dataError\", (errData: any) => reject(errData.parserError));\n    pdfParser.on(\"pdfParser_dataReady\", (pdfData: any) => {\n        resolve(pdfParser.getRawTextContent());\n    });\n    pdfParser.parseBuffer(buffer);\n  });\n}\n", "");

const backendCreateRegex = /if \(\!req\.body\.pdfBase64\) return res\.status\(400\)\.json\(\{ error: 'PDF file is required' \}\);\n\s*const dataBuffer = Buffer\.from\(req\.body\.pdfBase64, 'base64'\);\n\s*const text = await parsePDFBuffer\(dataBuffer\);/g;
indexTs = indexTs.replace(backendCreateRegex, `if (!req.body.extractedText) return res.status(400).json({ error: 'Extracted text is required' });
    const text = req.body.extractedText;`);

fs.writeFileSync('backend/src/index.ts', indexTs);
