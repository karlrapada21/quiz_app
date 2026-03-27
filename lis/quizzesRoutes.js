const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quizapp_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// GET /api/quizzes/questions?quiz=Quiz+Name
router.get('/questions', async (req, res) => {
  const quizName = req.query.quiz;
  if (!quizName) return res.status(400).json({ error: 'quiz query param required' });

  try {
    const [rows] = await pool.query(
      'SELECT QuizID, QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder FROM Quizzes WHERE QuizName = ? ORDER BY QuestionOrder ASC, QuizID ASC',
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
    const [rows] = await pool.query('SELECT DISTINCT QuizName FROM Quizzes ORDER BY QuizName ASC');
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
      'SELECT QuizID, QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder FROM Quizzes WHERE QuizID = ?',
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
// body: { QuizName, QuestionText, Options (array|null), Answer (value|array|null), QuestionType, TotalPoints, QuestionOrder }
router.post('/questions', async (req, res) => {
  const { QuizName, QuestionText, Options, Answer, QuestionType = 'open-ended', TotalPoints = 1, QuestionOrder = 0 } = req.body;
  if (!QuizName || !QuestionText) return res.status(400).json({ error: 'QuizName and QuestionText required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO Quizzes (QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
      'INSERT INTO QuizUserAnswers (UserID, QuizName, Questions, Answers) VALUES (?, ?, ?, ?)',
      [UserID, QuizName, JSON.stringify(Questions), JSON.stringify(Answers)]
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/quizzes/submit error', err);
    return res.status(500).json({ error: 'failed to submit answers' });
  }
});

module.exports = router;