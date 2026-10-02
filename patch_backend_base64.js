const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// Replace create endpoint
// app.post('/api/exams/create', upload.single('pdf'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No PDF file uploaded' });
//     }
//     const dataBuffer = req.file.buffer;

indexTs = indexTs.replace(/app\.post\('\/api\/exams\/create', upload\.single\('pdf'\), async \(req, res\) => \{\n\s*try \{\n\s*if \(\!req\.file\) \{\n\s*return res\.status\(400\)\.json\(\{ error: 'No PDF file uploaded' \}\);\n\s*\}\n\s*const dataBuffer = req\.file\.buffer;/g, 
`app.post('/api/exams/create', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    if (!req.body.pdfBase64) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    const dataBuffer = Buffer.from(req.body.pdfBase64, 'base64');`);

// Replace upload-key endpoint
indexTs = indexTs.replace(/app\.post\('\/api\/exams\/:examCode\/upload-key', upload\.single\('pdf'\), async \(req, res\) => \{\n\s*try \{\n\s*if \(\!req\.file\) \{\n\s*return res\.status\(400\)\.json\(\{ error: 'No PDF file uploaded' \}\);\n\s*\}\n\s*const dataBuffer = req\.file\.buffer;/g,
`app.post('/api/exams/:examCode/upload-key', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    if (!req.body.pdfBase64) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    const dataBuffer = Buffer.from(req.body.pdfBase64, 'base64');`);

// We also need to remove multer import entirely since it's no longer used
indexTs = indexTs.replace(/import multer from 'multer';\n/, '');
indexTs = indexTs.replace(/const upload = multer\(\{ storage: multer\.memoryStorage\(\) \}\);\n/, '');

fs.writeFileSync('backend/src/index.ts', indexTs);
