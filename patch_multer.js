const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// Replace disk storage with memory storage
indexTs = indexTs.replace(/const upload = multer\(\{ dest: os\.tmpdir\(\) \}\);/g, "const upload = multer({ storage: multer.memoryStorage() });");

// Replace fs.readFileSync(req.file.path) with req.file.buffer
indexTs = indexTs.replace(/const dataBuffer = fs\.readFileSync\(req\.file\.path\);/g, "const dataBuffer = req.file.buffer;");

// Remove fs.unlinkSync(req.file.path)
indexTs = indexTs.replace(/fs\.unlinkSync\(req\.file\.path\);/g, "// No disk file to delete");

fs.writeFileSync('backend/src/index.ts', indexTs);
