const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// Fix /api/exams/create
const createOld = `app.post('/api/exams/create', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examName, duration, numQuestions } = req.body;
    if (!req.body.pdfBase64) return res.status(400).json({ error: 'PDF file is required' });
    const dataBuffer = Buffer.from(req.body.pdfBase64, 'base64');
    const data = await pdfParse(dataBuffer);
    
    const questions = parseQuestions(data.text);`;

const createNew = `app.post('/api/exams/create', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examName, duration, numQuestions, extractedText } = req.body;
    if (!extractedText) return res.status(400).json({ error: 'Extracted text is required' });
    
    const questions = parseQuestions(extractedText);`;

indexTs = indexTs.replace(createOld, createNew);

// Fix /api/exams/:examCode/upload-key
const uploadOld = `app.post('/api/exams/:examCode/upload-key', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examCode } = req.params;
    const { token } = req.body;
    if (!req.body.pdfBase64) return res.status(400).json({ error: 'PDF file is required' });
    
    const exam: any = await get('SELECT id, adminToken FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.adminToken !== token) return res.status(403).json({ error: 'Unauthorized' });
    
    const dataBuffer = Buffer.from(req.body.pdfBase64, 'base64');
    const data = await pdfParse(dataBuffer);
    
    const parsedKey = parseAnswerKey(data.text);`;

const uploadNew = `app.post('/api/exams/:examCode/upload-key', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examCode } = req.params;
    const { token, extractedText } = req.body;
    if (!extractedText) return res.status(400).json({ error: 'Extracted text is required' });
    
    const exam: any = await get('SELECT id, adminToken FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.adminToken !== token) return res.status(403).json({ error: 'Unauthorized' });
    
    const parsedKey = parseAnswerKey(extractedText);`;

indexTs = indexTs.replace(uploadOld, uploadNew);

fs.writeFileSync('backend/src/index.ts', indexTs);
