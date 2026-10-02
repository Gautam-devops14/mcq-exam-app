const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

const createRoute = `
app.post('/api/exams/create', async (req, res) => {
  try {
    const { examName, duration, numQuestions, extractedText } = req.body;
    if (!extractedText) return res.status(400).json({ error: 'Extracted text is required' });
    
    const questions = parseQuestions(extractedText);
    const examCode = generateExamCode();
    const adminToken = crypto.randomUUID();
    
    await run(
      'INSERT INTO exams (examCode, adminToken, name, duration, numQuestions, questions) VALUES (?, ?, ?, ?, ?, ?)',
      [examCode, adminToken, examName, duration, numQuestions, JSON.stringify(questions)]
    );
    
    res.json({ examCode, adminToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse PDF and create exam' });
  }
});
`;

indexTs = indexTs.replace("app.get('/api/exams/:examCode'", createRoute + "\napp.get('/api/exams/:examCode'");

fs.writeFileSync('backend/src/index.ts', indexTs);
