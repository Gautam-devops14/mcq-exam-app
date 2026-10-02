const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

const oldUpload = `app.post('/api/exams/:examCode/upload-key', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examCode } = req.params;
    const { token } = req.body;
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });
    
    const exam: any = await get('SELECT id, adminToken FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.adminToken !== token) return res.status(403).json({ error: 'Unauthorized' });
    
    const dataBuffer = req.file.buffer;
    
    const parsedKey = parseAnswerKey(req.body.extractedText);`;

const newUpload = `app.post('/api/exams/:examCode/upload-key', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examCode } = req.params;
    const { token, extractedText } = req.body;
    if (!extractedText) return res.status(400).json({ error: 'Extracted text is required' });
    
    const exam: any = await get('SELECT id, adminToken FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.adminToken !== token) return res.status(403).json({ error: 'Unauthorized' });
    
    const parsedKey = parseAnswerKey(extractedText);`;

indexTs = indexTs.replace(oldUpload, newUpload);
fs.writeFileSync('backend/src/index.ts', indexTs);
