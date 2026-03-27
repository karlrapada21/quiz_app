// ...existing code...
const express = require('express');
const router = express.Router();

// DB helper - expects db.query(sql, params, cb)
let db;
try {
  db = require('./db');
} catch (e) {
  console.error('Warning: could not require ./db. Create lis/db.js that exports a query function.');
  db = {
    query: (_sql, _params, cb) => cb(new Error('DB helper not found'), null)
  };
}

// Auth middleware (optional). If present it should set req.user with UserID and Role.
let authMiddleware;
try {
  authMiddleware = require('./authMiddleware');
} catch (e) {
  authMiddleware = (req, _res, next) => next();
}

// Role middleware - optional
let roleMiddleware;
try {
  roleMiddleware = require('./roleMiddleware');
} catch (e) {
  roleMiddleware = {
    requireTeacher: (req, _res, next) => next(),
    requireStudent: (req, _res, next) => next()
  };
}

function safeParseJson(val) {
  try { return JSON.parse(val); } catch (e) { return null; }
}

/**
 * GET /api/quizzes/questions?quiz=Quiz+Name
 */
router.get('/questions', (req, res) => {
  const quizName = req.query.quiz;
  if (!quizName) return res.status(400).json({ error: 'quiz query param required' });

  const sql = 'SELECT QuizID, QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder FROM Quizzes WHERE QuizName = ? ORDER BY QuestionOrder ASC, QuizID ASC';
  db.query(sql, [quizName], (err, rows) => {
    if (err) {
      console.error('GET /api/quizzes/questions error', err);
      return res.status(500).json({ error: 'failed to load questions' });
    }
    const questions = (rows || []).map(r => ({
      id: r.QuizID,
      quizName: r.QuizName,
      question: r.QuestionText,
      options: r.OptionsJSON ? safeParseJson(r.OptionsJSON) : null,
      answer: r.AnswerJSON ? safeParseJson(r.AnswerJSON) : null,
      type: r.QuestionType,
      total: r.TotalPoints,
      order: r.QuestionOrder
    }));
    res.json({ questions });
  });
});

/**
 * GET /api/quizzes/questions/:id
 */
router.get('/questions/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT QuizID, QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder FROM Quizzes WHERE QuizID = ?';
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('GET /api/quizzes/questions/:id error', err);
      return res.status(500).json({ error: 'failed to load question' });
    }
    if (!rows || !rows[0]) return res.status(404).json({ error: 'not found' });
    const r = rows[0];
    const question = {
      id: r.QuizID,
      quizName: r.QuizName,
      question: r.QuestionText,
      options: r.OptionsJSON ? safeParseJson(r.OptionsJSON) : null,
      answer: r.AnswerJSON ? safeParseJson(r.AnswerJSON) : null,
      type: r.QuestionType,
      total: r.TotalPoints,
      order: r.QuestionOrder
    };
    res.json({ question });
  });
});

/**
 * POST /api/quizzes/questions (teacher only)
 */
router.post('/questions', authMiddleware, roleMiddleware.requireTeacher, (req, res) => {
  const { QuizName, QuestionText, Options, Answer, QuestionType = 'open-ended', TotalPoints = 1, QuestionOrder = 0 } = req.body;
  if (!QuizName || !QuestionText) return res.status(400).json({ error: 'QuizName and QuestionText required' });

  const sql = 'INSERT INTO Quizzes (QuizName, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints, QuestionOrder) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const optsJson = Options ? JSON.stringify(Options) : null;
  const ansJson = (Answer !== undefined && Answer !== null) ? JSON.stringify(Answer) : null;
  db.query(sql, [QuizName, QuestionText, optsJson, ansJson, QuestionType, TotalPoints, QuestionOrder], (err, result) => {
    if (err) {
      console.error('POST /api/quizzes/questions error', err);
      return res.status(500).json({ error: 'failed to create question' });
    }
    res.status(201).json({ insertedId: result.insertId });
  });
});

/**
 * POST /api/quizzes/submit
 * Save student's submission into QuizUserAnswers.
 * NOTE: your DB no longer has a Questions column; only save Answers here.
 * body: { QuizName, Answers, UserID? }
 */
router.post('/submit', authMiddleware, roleMiddleware.requireStudent, (req, res) => {
  try {
    const userId = req.user?.UserID || req.body.UserID || req.query.userId;
    const { QuizName, Answers } = req.body;
    if (!userId || !QuizName || !Answers) return res.status(400).json({ error: 'UserID (or auth), QuizName and Answers required' });

    // Only insert Answers column because Questions column was removed from DB
    db.query('INSERT INTO QuizUserAnswers (UserID, QuizName, Answers) VALUES (?, ?, ?)', [userId, QuizName, JSON.stringify(Answers)], (err, result) => {
      if (err) {
        console.error('POST /api/quizzes/submit DB error:', err);
        return res.status(500).json({ error: 'failed to save submission', details: err.message });
      }
      res.json({ message: 'Submission saved', id: result.insertId });
    });
  } catch (ex) {
    console.error('POST /api/quizzes/submit exception:', ex);
    res.status(500).json({ error: 'server error', details: ex.message });
  }
});

/**
 * POST /api/quiz_scores/add (student)
 */
router.post('/add', authMiddleware, roleMiddleware.requireStudent, (req, res) => {
  const userId = req.user?.UserID || req.body.UserID;
  const { QuizName, Score, Total } = req.body;
  if (!userId || !QuizName || Score === undefined || Total === undefined) {
    return res.status(400).json({ error: 'UserID (or auth), QuizName, Score and Total required' });
  }

  const sql = 'INSERT INTO QuizScores (UserID, QuizName, Score, Total) VALUES (?, ?, ?, ?)';
  db.query(sql, [userId, QuizName, Score, Total], (err, result) => {
    if (err) {
      console.error('POST /api/quiz_scores/add error', err);
      return res.status(500).json({ error: 'failed to save score' });
    }
    res.json({ insertedId: result.insertId });
  });
});

/**
 * GET /api/quiz_scores/myscores
 */
router.get('/myscores', authMiddleware, (req, res) => {
  const userId = req.user?.UserID || req.query.userId;
  if (!userId) return res.status(200).json({ scores: [] });

  const sql = 'SELECT ScoreID, UserID, QuizName, Score, Total FROM QuizScores WHERE UserID = ? ORDER BY ScoreID DESC';
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error('GET /api/quiz_scores/myscores error', err);
      return res.status(500).json({ error: 'failed to load scores' });
    }
    res.json({ scores: rows || [] });
  });
});

/**
 * GET /api/quiz_scores/user/:userId
 */
router.get('/user/:userId', authMiddleware, (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sql = 'SELECT ScoreID, UserID, QuizName, Score, Total FROM QuizScores WHERE UserID = ? ORDER BY ScoreID DESC';
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error('GET /api/quiz_scores/user/:userId error', err);
      return res.status(500).json({ error: 'failed to load scores' });
    }
    res.json({ scores: rows || [] });
  });
});

/**
 * GET /api/quiz_scores/averages
 */
router.get('/averages', (_req, res) => {
  const sql = `
    SELECT QuizName,
           ROUND(AVG(Score),2) AS avgScore,
           ROUND(AVG(Score/NULLIF(Total,0))*100,2) AS avgPercent,
           COUNT(*) AS attempts
    FROM QuizScores
    GROUP BY QuizName
    ORDER BY QuizName
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('GET /api/quiz_scores/averages error', err);
      return res.status(500).json({ error: 'failed to load averages' });
    }
    res.json({ averages: rows || [] });
  });
});

module.exports = router;
// ...existing code...