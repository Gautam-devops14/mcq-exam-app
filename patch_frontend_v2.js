const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // We need to put the missing fields back into the JSON payload
  const oldTry = `const response = await axios.post(\\\`\\\${API_URL}/exams/create\\\`, { pdfBase64: base64 }, {
        headers: { 'Content-Type': 'application/json' }
      });`;
      
  const newTry = `const response = await axios.post(\`\${API_URL}/exams/create\`, { 
        pdfBase64: base64,
        examName,
        duration: Number(duration),
        numQuestions: Number(numQuestions)
      }, {
        headers: { 'Content-Type': 'application/json' }
      });`;

  // Fix the backticks since I'm using string replacement
  code = code.replace("const response = await axios.post(`${API_URL}/exams/create`, { pdfBase64: base64 }, {", 
  `const response = await axios.post(\`\${API_URL}/exams/create\`, { 
        pdfBase64: base64,
        examName,
        duration: Number(duration),
        numQuestions: Number(numQuestions)
      }, {`);

  fs.writeFileSync(file, code);
}

patchFile('frontend/src/pages/CreateExam.tsx');

