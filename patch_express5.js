const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// Remove the express.static and app.get('*') logic since Vercel handles frontend hosting
const toRemove = `// Serve frontend static files in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});`;

if (indexTs.includes(toRemove)) {
  indexTs = indexTs.replace(toRemove, '');
} else {
    // try removing just app.get('*'
    const fallbackBlock = `app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});`;
    indexTs = indexTs.replace(fallbackBlock, '');
}

fs.writeFileSync('backend/src/index.ts', indexTs);
