const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// Fix explicit anys
code = code.replace("let answers = {};", "let answers: any = {};");
code = code.replace("const exam = await get('SELECT status, answerKey FROM exams WHERE examCode = ?', [examCode]);", "const exam: any = await get('SELECT status, answerKey FROM exams WHERE examCode = ?', [examCode]);");
code = code.replace("const participant = await get('SELECT name, answers, score, totalCorrect, totalWrong, totalUnanswered FROM participants WHERE id = ? AND examCode = ?', [participantId, examCode]);", "const participant: any = await get('SELECT name, answers, score, totalCorrect, totalWrong, totalUnanswered FROM participants WHERE id = ? AND examCode = ?', [participantId, examCode]);");

fs.writeFileSync('backend/src/index.ts', code);
