const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const newEndpoints = `
app.get('/api/exams/:examCode', async (req, res) => {
  try {
    const { examCode } = req.params;
    const exam = await get('SELECT examCode, name, duration, numQuestions, status, questions FROM exams WHERE examCode = ?', [examCode]);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // Parse questions json string
    if (exam.questions) {
      exam.questions = JSON.parse(exam.questions);
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

app.post('/api/exams/:examCode/join', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const exam = await get('SELECT status FROM exams WHERE examCode = ?', [examCode]);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.status !== 'OPEN') return res.status(400).json({ error: 'Exam is no longer open' });
    
    // Create participant
    const result = await run('INSERT INTO participants (examCode, name, answers) VALUES (?, ?, ?)', [examCode, name, JSON.stringify({})]);
    
    res.json({ success: true, participantId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join exam' });
  }
});

app.post('/api/exams/:examCode/answers', async (req, res) => {
  try {
    const { participantId, answers, isSubmit } = req.body;
    if (!participantId) return res.status(400).json({ error: 'Participant ID required' });
    
    const status = isSubmit ? 'SUBMITTED' : 'IN_PROGRESS';
    
    await run('UPDATE participants SET answers = ?, status = ? WHERE id = ?', [JSON.stringify(answers), status, participantId]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save answers' });
  }
});
`;

code = code.replace("app.listen(port", newEndpoints + "\napp.listen(port");
fs.writeFileSync('backend/src/index.ts', code);
