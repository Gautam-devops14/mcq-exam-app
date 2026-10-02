const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

indexTs = indexTs.replace(/if \(\!req\.file\) return res\.status\(400\)\.json\(\{ error: 'PDF file is required' \}\);\s*const dataBuffer = req\.file\.buffer;/g, 
`if (!req.body.pdfBase64) return res.status(400).json({ error: 'PDF file is required' });
    const dataBuffer = Buffer.from(req.body.pdfBase64, 'base64');`);

fs.writeFileSync('backend/src/index.ts', indexTs);
