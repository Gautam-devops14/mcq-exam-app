"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = require("pdf-parse");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const db_1 = require("./db");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const upload = (0, multer_1.default)({ dest: 'uploads/' });
(0, db_1.initDb)().then(() => console.log('Database initialized'));
const generateExamCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let prefix = '';
    for (let i = 0; i < 5; i++)
        prefix += chars.charAt(Math.floor(Math.random() * chars.length));
    let suffix = '';
    for (let i = 0; i < 4; i++)
        suffix += digits.charAt(Math.floor(Math.random() * digits.length));
    return `${prefix}-${suffix}`;
};
// Parser logic for MCQs
function parseQuestions(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const questions = [];
    let currentQuestion = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^(Question\s*\d+|Q\d+|\d+\.)/i.test(line)) {
            if (currentQuestion)
                questions.push(currentQuestion);
            currentQuestion = {
                id: questions.length + 1,
                question: line,
                options: {}
            };
        }
        else if (currentQuestion) {
            const optMatch = line.match(/^([A-D])[\.\)]\s*(.*)/i);
            if (optMatch) {
                currentQuestion.options[optMatch[1].toUpperCase()] = optMatch[2];
            }
            else if (Object.keys(currentQuestion.options).length === 0) {
                currentQuestion.question += ' ' + line;
            }
        }
    }
    if (currentQuestion)
        questions.push(currentQuestion);
    return questions;
}
// Stage 7 Parser logic for Answer Key
function parseAnswerKey(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const answerKey = {};
    for (let line of lines) {
        const match = line.match(/^(?:Q)?(\d+)(?:\.|\)|\s|-)*([A-D])/i);
        if (match) {
            answerKey[match[1]] = match[2].toUpperCase();
        }
    }
    return answerKey;
}
app.post('/api/exams/create', upload.single('pdf'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examName, duration, numQuestions } = req.body;
        if (!req.file)
            return res.status(400).json({ error: 'PDF file is required' });
        const dataBuffer = fs_1.default.readFileSync(req.file.path);
        const parser = new pdf_parse_1.PDFParse({ data: dataBuffer });
        const data = yield parser.getText();
        const questions = parseQuestions(data.text);
        const examCode = generateExamCode();
        const adminToken = (0, uuid_1.v4)();
        yield (0, db_1.run)(`
      INSERT INTO exams (examCode, adminToken, name, duration, numQuestions, questions)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [examCode, adminToken, examName, duration || null, questions.length, JSON.stringify(questions)]);
        fs_1.default.unlinkSync(req.file.path);
        res.json({ success: true, examCode, adminToken, questionsParsed: questions.length });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to parse PDF and create exam' });
    }
}));
app.get('/api/exams/:examCode', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examCode } = req.params;
        const exam = yield (0, db_1.get)('SELECT examCode, name, duration, numQuestions, status, questions FROM exams WHERE examCode = ?', [examCode]);
        if (!exam)
            return res.status(404).json({ error: 'Exam not found' });
        if (exam.questions)
            exam.questions = JSON.parse(exam.questions);
        res.json(exam);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch exam' });
    }
}));
app.post('/api/exams/:examCode/join', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examCode } = req.params;
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Name is required' });
        const exam = yield (0, db_1.get)('SELECT status FROM exams WHERE examCode = ?', [examCode]);
        if (!exam)
            return res.status(404).json({ error: 'Exam not found' });
        if (exam.status !== 'OPEN')
            return res.status(400).json({ error: 'Exam is no longer open' });
        const result = yield (0, db_1.run)('INSERT INTO participants (examCode, name, answers) VALUES (?, ?, ?)', [examCode, name, JSON.stringify({})]);
        res.json({ success: true, participantId: result.lastID });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to join exam' });
    }
}));
app.post('/api/exams/:examCode/answers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { participantId, answers, isSubmit } = req.body;
        if (!participantId)
            return res.status(400).json({ error: 'Participant ID required' });
        const status = isSubmit ? 'SUBMITTED' : 'IN_PROGRESS';
        yield (0, db_1.run)('UPDATE participants SET answers = ?, status = ? WHERE id = ?', [JSON.stringify(answers), status, participantId]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save answers' });
    }
}));
// Stage 6 & 7 endpoints
app.get('/api/exams/:examCode/organizer', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examCode } = req.params;
        const { token } = req.query;
        const exam = yield (0, db_1.get)('SELECT name, status, answerKey FROM exams WHERE examCode = ? AND adminToken = ?', [examCode, token]);
        if (!exam)
            return res.status(403).json({ error: 'Unauthorized or exam not found' });
        const participants = yield (0, db_1.all)('SELECT id, name, status, score, totalCorrect, totalWrong, totalUnanswered FROM participants WHERE examCode = ?', [examCode]);
        res.json({
            success: true,
            exam: {
                name: exam.name,
                status: exam.status,
                hasAnswerKey: !!exam.answerKey
            },
            participants
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch organizer data' });
    }
}));
app.post('/api/exams/:examCode/upload-key', upload.single('pdf'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examCode } = req.params;
        const { token } = req.body;
        if (!req.file)
            return res.status(400).json({ error: 'PDF file is required' });
        const exam = yield (0, db_1.get)('SELECT id, adminToken FROM exams WHERE examCode = ?', [examCode]);
        if (!exam || exam.adminToken !== token)
            return res.status(403).json({ error: 'Unauthorized' });
        const dataBuffer = fs_1.default.readFileSync(req.file.path);
        const parser = new pdf_parse_1.PDFParse({ data: dataBuffer });
        const data = yield parser.getText();
        const parsedKey = parseAnswerKey(data.text);
        // We update DB but we don't automatically score yet, or we score immediately?
        // User flow: Upload -> Parse -> Confirm -> Results.
        // For MVP, we will return the parsed key so organizer can confirm.
        fs_1.default.unlinkSync(req.file.path);
        res.json({ success: true, parsedKey });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to parse Answer Key PDF' });
    }
}));
app.post('/api/exams/:examCode/release-results', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examCode } = req.params;
        const { token, confirmedKey } = req.body;
        const exam = yield (0, db_1.get)('SELECT questions, adminToken FROM exams WHERE examCode = ?', [examCode]);
        if (!exam || exam.adminToken !== token)
            return res.status(403).json({ error: 'Unauthorized' });
        const questions = JSON.parse(exam.questions);
        // Update exam status to RESULTS and save key
        yield (0, db_1.run)('UPDATE exams SET status = ?, answerKey = ? WHERE examCode = ?', ['RESULTS', JSON.stringify(confirmedKey), examCode]);
        // Calculate results for all participants
        const participants = yield (0, db_1.all)('SELECT id, answers FROM participants WHERE examCode = ?', [examCode]);
        for (let p of participants) {
            let answers = {};
            if (p.answers)
                answers = JSON.parse(p.answers);
            let correct = 0;
            let wrong = 0;
            let unanswered = 0;
            for (let q of questions) {
                const pAns = answers[q.id];
                const cAns = confirmedKey[q.id];
                if (!pAns)
                    unanswered++;
                else if (pAns === cAns)
                    correct++;
                else
                    wrong++;
            }
            yield (0, db_1.run)('UPDATE participants SET score = ?, totalCorrect = ?, totalWrong = ?, totalUnanswered = ? WHERE id = ?', [correct, correct, wrong, unanswered, p.id]);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to release results' });
    }
}));
app.get('/api/exams/:examCode/result', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examCode } = req.params;
        const { participantId } = req.query;
        const exam = yield (0, db_1.get)('SELECT status, answerKey FROM exams WHERE examCode = ?', [examCode]);
        if (!exam || exam.status !== 'RESULTS')
            return res.status(400).json({ error: 'Results not available yet' });
        const participant = yield (0, db_1.get)('SELECT name, answers, score, totalCorrect, totalWrong, totalUnanswered FROM participants WHERE id = ? AND examCode = ?', [participantId, examCode]);
        if (!participant)
            return res.status(404).json({ error: 'Participant not found' });
        if (participant.answers)
            participant.answers = JSON.parse(participant.answers);
        res.json({
            success: true,
            result: participant,
            key: JSON.parse(exam.answerKey)
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch result' });
    }
}));
// Serve frontend static files in production
const frontendDist = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDist));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path_1.default.join(frontendDist, 'index.html'));
    }
});
app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});
