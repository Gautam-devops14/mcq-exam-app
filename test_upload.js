const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios'); // need to npm install axios in backend, or just use fetch

(async () => {
  try {
    const form = new FormData();
    form.append('examName', 'Test Exam');
    form.append('duration', '30');
    form.append('numQuestions', '2');
    form.append('pdf', fs.createReadStream('sample_questions.pdf'));
    
    // Using dynamic import for fetch since node v18+ supports it
    const res = await fetch('http://localhost:3001/api/exams/create', {
      method: 'POST',
      body: form,
      // In node fetch with form-data, we might need to set headers
    });
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
})();
