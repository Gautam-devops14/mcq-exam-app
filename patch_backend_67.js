const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const endpoints67 = `
app.get('/api/exams/:examCode/participants', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { adminToken } = req.query;
    
    const exam = await get('SELECT adminToken FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.adminToken !== adminToken) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const participants = await get('SELECT * FROM participants WHERE examCode = ?', [examCode]) || [];
    // If it's a single row 'get' returns one object, we need 'all' for multiple rows.
    // wait, we should require 'all' from db.ts
    // Let's assume we can dynamically require it if not imported
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});
`;

// It's safer to just rewrite the whole file with the new endpoints to avoid import issues.
