const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Find where it sends FormData
  // const formData = new FormData();
  // formData.append('pdf', selectedFile);
  
  // We need to replace the axios.post logic.
  // The easiest way is to use a regex to replace the try block body.
  const oldTry = `const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await axios.post(\`\${API_URL}/exams/create\`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });`;
      
  const newTry = `const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });

      const response = await axios.post(\`\${API_URL}/exams/create\`, { pdfBase64: base64 }, {
        headers: { 'Content-Type': 'application/json' }
      });`;

  code = code.replace(oldTry, newTry);
  fs.writeFileSync(file, code);
}

patchFile('frontend/src/pages/CreateExam.tsx');

function patchOrganizer(file) {
  let code = fs.readFileSync(file, 'utf8');
  const oldTry = `const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      setUploading(true);
      setError('');
      const response = await axios.post(\`\${API_URL}/exams/\${exam.examCode}/upload-key\`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });`;
      
  const newTry = `try {
      setUploading(true);
      setError('');
      
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });

      const response = await axios.post(\`\${API_URL}/exams/\${exam.examCode}/upload-key\`, { pdfBase64: base64 }, {
        headers: { 'Content-Type': 'application/json' }
      });`;

  code = code.replace(oldTry, newTry);
  fs.writeFileSync(file, code);
}

patchOrganizer('frontend/src/pages/OrganizerPanel.tsx');

