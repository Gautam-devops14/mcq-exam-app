const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const resultEndpoint = `
app.get('/api/exams/:examCode/result', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { participantId } = req.query;
    
    const exam = await get('SELECT status, answerKey FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.status !== 'RESULTS') return res.status(400).json({ error: 'Results not available yet' });
    
    const participant = await get('SELECT name, answers, score, totalCorrect, totalWrong, totalUnanswered FROM participants WHERE id = ? AND examCode = ?', [participantId, examCode]);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    
    if (participant.answers) participant.answers = JSON.parse(participant.answers);
    
    res.json({
      success: true,
      result: participant,
      key: JSON.parse(exam.answerKey)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});
`;

code = code.replace("app.listen(port", resultEndpoint + "\napp.listen(port");
fs.writeFileSync('backend/src/index.ts', code);
