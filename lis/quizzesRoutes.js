const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
require('dotenv').config();

// Import shared database pool from db.js for consistent connection management
// Note: We still create a promise-based pool here for async/await support
const db = require('./db');

// Create a promise-based pool for async/await queries
const getDbConfig = () => {
    if (process.env.MYSQL_URL) {
        const url = new URL(process.env.MYSQL_URL);
        return {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.replace('/', '') || 'railway',
            port: parseInt(url.port) || 3306,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
    }
    return {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'quizapp_db',
        port: process.env.MYSQLPORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
};

// Use connection pool with promise wrapper for async/await support
const pool = mysql.createPool(getDbConfig()).promise();

// GET /api/quizzes/questions?quiz=Quiz+Name
router.get('/questions', async (req, res) => {
  const quizName = req.query.quiz;
  if (!quizName) return res.status(400).json({ error: 'quiz query param required' });

  try {
    const [rows] = await pool.query(
      'SELECT QuizID, QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder FROM quizzes WHERE QuizName = ? ORDER BY QuestionOrder ASC, QuizID ASC',
      [quizName]
    );

    const questions = rows.map(r => ({
      id: r.QuizID,
      quizName: r.QuizName,
      question: r.QuestionText,
      options: r.OptionsJSON ? JSON.parse(r.OptionsJSON) : null,
      answer: r.AnswerJSON ? JSON.parse(r.AnswerJSON) : null,
      type: r.QuestionType,
      total: r.TotalPoints,
      order: r.QuestionOrder
    }));

    return res.json({ questions });
  } catch (err) {
    console.error('GET /api/quizzes/questions error', err);
    return res.status(500).json({ error: 'failed to load questions' });
  }
});

// GET /api/quizzes/list
router.get('/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT QuizName FROM quizzes ORDER BY QuizName ASC');
    const quizNames = rows.map(r => r.QuizName);
    return res.json({ quizzes: quizNames });
  } catch (err) {
    console.error('GET /api/quizzes/list error', err);
    return res.status(500).json({ error: 'failed to load quiz list' });
  }
});

// GET /api/quizzes/questions/:id
router.get('/questions/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query(
      'SELECT QuizID, QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder FROM quizzes WHERE QuizID = ?',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    const r = rows[0];
    const question = {
      id: r.QuizID,
      quizName: r.QuizName,
      question: r.QuestionText,
      options: r.OptionsJSON ? JSON.parse(r.OptionsJSON) : null,
      answer: r.AnswerJSON ? JSON.parse(r.AnswerJSON) : null,
      type: r.QuestionType,
      total: r.TotalPoints,
      order: r.QuestionOrder
    };
    return res.json({ question });
  } catch (err) {
    console.error('GET /api/quizzes/questions/:id error', err);
    return res.status(500).json({ error: 'failed to load question' });
  }
});

// POST /api/quizzes/questions  (admin) -> create question
router.post('/questions', async (req, res) => {
  const { QuizName, QuestionText, Options, Answer, QuestionType = 'open-ended', TotalPoints = 1, QuestionOrder = 0 } = req.body;
  if (!QuizName || !QuestionText) return res.status(400).json({ error: 'QuizName and QuestionText required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO quizzes (QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        QuizName,
        QuestionText,
        Options ? JSON.stringify(Options) : null,
        (Answer !== undefined && Answer !== null) ? JSON.stringify(Answer) : null,
        QuestionType,
        TotalPoints,
        QuestionOrder
      ]
    );
    return res.status(201).json({ insertedId: result.insertId });
  } catch (err) {
    console.error('POST /api/quizzes/questions error', err);
    return res.status(500).json({ error: 'failed to create question' });
  }
});

// POST /api/quizzes/submit  (submit answers)
router.post('/submit', async (req, res) => {
  const { QuizName, Questions, Answers, UserID } = req.body;
  if (!QuizName || !Answers || !UserID) return res.status(400).json({ error: 'QuizName, Answers, and UserID required' });

  try {
    await pool.query(
      'INSERT INTO quizuseranswers (UserID, QuizName, Questions, Answers) VALUES (?, ?, ?, ?)',
      [UserID, QuizName, JSON.stringify(Questions), JSON.stringify(Answers)]
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/quizzes/submit error', err);
    return res.status(500).json({ error: 'failed to submit answers' });
  }
});

module.exports = router;