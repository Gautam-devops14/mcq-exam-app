const fs = require('fs');

let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

// The ones I just inserted start with `const generateExamCode = () => {` and end before `app.post('/api/exams/create'`
// I will just remove the ones I inserted!
indexTs = indexTs.replace(/const generateExamCode = \(\) => \{[\s\S]*?\}\n\napp\.post\('\/api\/exams\/create'/, "app.post('/api/exams/create'");

fs.writeFileSync('backend/src/index.ts', indexTs);
