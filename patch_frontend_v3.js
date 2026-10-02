const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/CreateExam.tsx', 'utf8');

const regex = /const response = await axios\.post\(`\$\{API_URL\}\/exams\/create`, \{ pdfBase64: base64 \}, \{[^}]+\}\);/s;

const replacement = `const response = await axios.post(\`\${API_URL}/exams/create\`, { 
        pdfBase64: base64,
        examName,
        duration: Number(duration),
        numQuestions: Number(numQuestions)
      }, {
        headers: { 'Content-Type': 'application/json' }
      });`;

code = code.replace(regex, replacement);
fs.writeFileSync('frontend/src/pages/CreateExam.tsx', code);
