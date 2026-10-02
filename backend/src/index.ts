import express from 'express';
import cors from 'cors';
const { PdfReader } = require('pdfreader');
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = '';
    new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
      if (err) reject(err);
      else if (!item) resolve(text);
      else if (item.text) text += item.text + '\n';
    });
  });
}

import { initDb, run, get, all } from './db';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

import os from 'os';

initDb().then(() => console.log('Database initialized'));

const generateExamCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let prefix = '';
  for(let i=0; i<5; i++) prefix += chars.charAt(Math.floor(Math.random() * chars.length));
  let suffix = '';
  for(let i=0; i<4; i++) suffix += digits.charAt(Math.floor(Math.random() * digits.length));
  return `${prefix}-${suffix}`;
};

// Parser logic for MCQs
function parseQuestions(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];
  let currentQuestion = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(Question\s*\d+|Q\d+|\d+\.)/i.test(line)) {
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        id: questions.length + 1,
        question: line,
        options: {} as Record<string, string>
      };
    } else if (currentQuestion) {
      const optMatch = line.match(/^([A-D])[\.\)]\s*(.*)/i);
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
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const answerKey: Record<string, string> = {};
  
  for (let line of lines) {
    const match = line.match(/^(?:Q)?(\d+)(?:\.|\)|\s|-)*([A-D])/i);
    if (match) {
      answerKey[match[1]] = match[2].toUpperCase();
    }
  }
  return answerKey;
}

app.post('/api/exams/create', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examName, duration, numQuestions } = req.body;
    if (!req.body.pdfBase64) return res.status(400).json({ error: 'PDF file is required' });
    const dataBuffer = Buffer.from(req.body.pdfBase64, 'base64');
    const data = await pdfParse(dataBuffer);
    
    const questions = parseQuestions(data.text);
    const examCode = generateExamCode();
    const adminToken = crypto.randomUUID();
    
    await run(`
      INSERT INTO exams (examCode, adminToken, name, duration, numQuestions, questions)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [examCode, adminToken, examName, duration || null, questions.length, JSON.stringify(questions)]);
    
    // No disk file to delete
    
    res.json({ success: true, examCode, adminToken, questionsParsed: questions.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse PDF and create exam' });
  }
});

app.get('/api/exams/:examCode', async (req, res) => {
  try {
    const { examCode } = req.params;
    const exam: any = await get('SELECT examCode, name, duration, numQuestions, status, questions FROM exams WHERE examCode = ?', [examCode]);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    if (exam.questions) exam.questions = JSON.parse(exam.questions);
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

app.post('/api/exams/:examCode/join', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const exam: any = await get('SELECT status FROM exams WHERE examCode = ?', [examCode]);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.status !== 'OPEN') return res.status(400).json({ error: 'Exam is no longer open' });
    
    const result: any = await run('INSERT INTO participants (examCode, name, answers) VALUES (?, ?, ?)', [examCode, name, JSON.stringify({})]);
    
    res.json({ success: true, participantId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join exam' });
  }
});

app.post('/api/exams/:examCode/answers', async (req, res) => {
  try {
    const { participantId, answers, isSubmit } = req.body;
    if (!participantId) return res.status(400).json({ error: 'Participant ID required' });
    
    const status = isSubmit ? 'SUBMITTED' : 'IN_PROGRESS';
    await run('UPDATE participants SET answers = ?, status = ? WHERE id = ?', [JSON.stringify(answers), status, participantId]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save answers' });
  }
});

// Stage 6 & 7 endpoints
app.get('/api/exams/:examCode/organizer', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { token } = req.query;
    
    const exam: any = await get('SELECT name, status, answerKey FROM exams WHERE examCode = ? AND adminToken = ?', [examCode, token]);
    if (!exam) return res.status(403).json({ error: 'Unauthorized or exam not found' });
    
    const participants = await all('SELECT id, name, status, score, totalCorrect, totalWrong, totalUnanswered FROM participants WHERE examCode = ?', [examCode]);
    
    res.json({
      success: true,
      exam: {
        name: exam.name,
        status: exam.status,
        hasAnswerKey: !!exam.answerKey
      },
      participants
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organizer data' });
  }
});

app.post('/api/exams/:examCode/upload-key', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { examCode } = req.params;
    const { token } = req.body;
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });
    
    const exam: any = await get('SELECT id, adminToken FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.adminToken !== token) return res.status(403).json({ error: 'Unauthorized' });
    
    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);
    
    const parsedKey = parseAnswerKey(data.text);
    
    // We update DB but we don't automatically score yet, or we score immediately?
    // User flow: Upload -> Parse -> Confirm -> Results.
    // For MVP, we will return the parsed key so organizer can confirm.
    
    // No disk file to delete
    
    res.json({ success: true, parsedKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse Answer Key PDF' });
  }
});

app.post('/api/exams/:examCode/release-results', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { token, confirmedKey } = req.body;
    
    const exam: any = await get('SELECT questions, adminToken FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.adminToken !== token) return res.status(403).json({ error: 'Unauthorized' });
    
    const questions = JSON.parse(exam.questions);
    
    // Update exam status to RESULTS and save key
    await run('UPDATE exams SET status = ?, answerKey = ? WHERE examCode = ?', ['RESULTS', JSON.stringify(confirmedKey), examCode]);
    
    // Calculate results for all participants
    const participants: any = await all('SELECT id, answers FROM participants WHERE examCode = ?', [examCode]);
    
    for (let p of participants) {
      let answers: any = {};
      if (p.answers) answers = JSON.parse(p.answers);
      
      let correct = 0;
      let wrong = 0;
      let unanswered = 0;
      
      for (let q of questions) {
        const pAns = answers[q.id];
        const cAns = confirmedKey[q.id];
        if (!pAns) unanswered++;
        else if (pAns === cAns) correct++;
        else wrong++;
      }
      
      await run('UPDATE participants SET score = ?, totalCorrect = ?, totalWrong = ?, totalUnanswered = ? WHERE id = ?', 
        [correct, correct, wrong, unanswered, p.id]);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to release results' });
  }
});


app.get('/api/exams/:examCode/result', async (req, res) => {
  try {
    const { examCode } = req.params;
    const { participantId } = req.query;
    
    const exam: any = await get('SELECT status, answerKey FROM exams WHERE examCode = ?', [examCode]);
    if (!exam || exam.status !== 'RESULTS') return res.status(400).json({ error: 'Results not available yet' });
    
    const participant: any = await get('SELECT name, answers, score, totalCorrect, totalWrong, totalUnanswered FROM participants WHERE id = ? AND examCode = ?', [participantId, examCode]);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    
    if (participant.answers) participant.answers = JSON.parse(participant.answers);
    
    res.json({
      success: true,
      result: participant,
      key: JSON.parse(exam.answerKey)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});





if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}
export default app;

