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
exports.initDb = exports.all = exports.get = exports.run = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const db = new sqlite3_1.default.Database('./mcq.db');
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else
                resolve(this);
        });
    });
};
exports.run = run;
const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
};
exports.get = get;
const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
exports.all = all;
const initDb = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.run)(`
    CREATE TABLE IF NOT EXISTS exams (
      examCode TEXT PRIMARY KEY,
      adminToken TEXT,
      name TEXT,
      duration INTEGER,
      numQuestions INTEGER,
      status TEXT DEFAULT 'OPEN',
      answerKey JSON,
      questions JSON,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    yield (0, exports.run)(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examCode TEXT,
      name TEXT,
      answers JSON,
      status TEXT DEFAULT 'IN_PROGRESS',
      score INTEGER,
      totalCorrect INTEGER,
      totalWrong INTEGER,
      totalUnanswered INTEGER
    )
  `);
});
exports.initDb = initDb;
