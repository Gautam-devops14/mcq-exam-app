const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// Add path import if not present
if (!code.includes("import path from 'path';")) {
  code = code.replace("import fs from 'fs';", "import fs from 'fs';\nimport path from 'path';");
}

const serveStaticCode = `
// Serve frontend static files in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});
`;

if (!code.includes("express.static(frontendDist)")) {
  code = code.replace("app.listen(port", serveStaticCode + "\napp.listen(port");
  fs.writeFileSync('backend/src/index.ts', code);
}
