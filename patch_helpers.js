const fs = require('fs');
let indexTs = fs.readFileSync('backend/src/index.ts', 'utf8');

const helpers = `
const generateExamCode = () => {
  const prefix = Math.random().toString(36).substring(2, 5).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return \`\${prefix}-\${suffix}\`;
};

// Parser logic for MCQs
function parseQuestions(text: string) {
  const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];
  let currentQuestion: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(Question\\s*\\d+|Q\\d+|\\d+\\.)/i.test(line)) {
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        id: (questions.length + 1).toString(),
        question: line,
        options: {} as Record<string, string>
      };
    } else if (currentQuestion) {
      const optMatch = line.match(/^([A-D])[\\.\\)]\\s*(.*)/i);
      if (optMatch) {
        currentQuestion.options[optMatch[1].toUpperCase()] = optMatch[2];
      } else if (Object.keys(currentQuestion.options).length === 0) {
        currentQuestion.question += ' ' + line;
      }
    }
  }
  if (currentQuestion) questions.push(currentQuestion);
  return questions;
}

// Stage 7 Parser logic for Answer Key
function parseAnswerKey(text: string) {
  const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
  const answerKey: Record<string, string> = {};
  
  for (let line of lines) {
    const match = line.match(/^(?:Q)?(\\d+)(?:\\.|\\)|\\s|-)*([A-D])/i);
    if (match) {
      answerKey[match[1]] = match[2].toUpperCase();
    }
  }
  return answerKey;
}
`;

indexTs = indexTs.replace("app.post('/api/exams/create'", helpers + "\napp.post('/api/exams/create'");
fs.writeFileSync('backend/src/index.ts', indexTs);
