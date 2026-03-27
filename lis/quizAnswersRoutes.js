const express = require("express");
const router = express.Router();
let db;
try { db = require("./db"); } catch (e) {
  console.error("Warning: ./db not found, create lis/db.js that exports a query function.");
  db = { query: (_sql, _params, cb) => cb(new Error("DB helper not found"), null) };
}

let authMiddleware;
try { authMiddleware = require("./authMiddleware"); } catch (e) {
  authMiddleware = (_req, _res, next) => next();
}

/**
 * Helper: fetch canonical questions for a quiz
 */
function fetchQuizQuestions(quizName, cb) {
  const sql = `SELECT QuizID, QuestionText, OptionsJSON, AnswerJSON, QuestionType, TotalPoints
               FROM Quizzes WHERE QuizName = ? ORDER BY QuestionOrder ASC, QuizID ASC`;
  db.query(sql, [quizName], (err, rows) => {
    if (err) return cb(err);
    const questions = (rows || []).map(r => {
      let options = null;
      let answer = null;
      try { options = r.OptionsJSON ? JSON.parse(r.OptionsJSON) : null; } catch (e) { options = null; }
      try { answer = r.AnswerJSON ? JSON.parse(r.AnswerJSON) : null; } catch (e) { answer = null; }
      return {
        question: r.QuestionText,
        options,
        answer: Array.isArray(answer) ? undefined : answer,
        answers: Array.isArray(answer) ? answer : undefined,
        type: r.QuestionType,
        total: r.TotalPoints
      };
    });
    cb(null, questions);
  });
}

/**
 * Helper: compute total points from Quizzes table for a quizName
 */
function fetchTotalForQuiz(quizName, cb) {
  const sql = "SELECT IFNULL(SUM(TotalPoints), 0) AS total FROM Quizzes WHERE QuizName = ?";
  db.query(sql, [quizName], (err, rows) => {
    if (err) return cb(err);
    const total = rows && rows[0] ? Number(rows[0].total) || 0 : 0;
    cb(null, total > 0 ? total : null);
  });
}

/**
 * POST /submit
 * Save user's answers for a quiz (Answers only). Requires auth or userId in body/query.
 * body: { QuizName, Answers, UserID? }
 */
router.post("/submit", authMiddleware, (req, res) => {
  try {
    const { QuizName, Answers } = req.body;
    const user_id = req.user?.UserID || req.body.UserID || req.query.userId;
    if (!user_id) return res.status(401).json({ error: "Missing user (auth or UserID required)" });
    if (!QuizName || !Answers) return res.status(400).json({ error: "QuizName and Answers required" });

    db.query(
      "INSERT INTO QuizUserAnswers (UserID, QuizName, Answers) VALUES (?, ?, ?)",
      [user_id, QuizName, JSON.stringify(Answers)],
      (err, result) => {
        if (err) {
          console.error("DB error insert QuizUserAnswers:", err);
          return res.status(500).json({ error: "DB error", details: err.message });
        }
        res.json({ message: "Answers saved", answerId: result.insertId });
      }
    );
  } catch (ex) {
    console.error("Exception in /submit:", ex);
    res.status(500).json({ error: "server error", details: ex.message });
  }
});

/**
 * GET /user/:quizName
 * Get latest submission for authenticated user (or ?userId= for testing).
 */
router.get("/user/:quizName", authMiddleware, (req, res) => {
  const quizName = req.params.quizName;
  const user_id = req.user?.UserID || req.query.userId;
  if (!user_id) return res.status(401).json({ error: "Missing user (auth or ?userId required)" });

  db.query(
    `SELECT AnswerID, Answers, SubmittedAt
     FROM QuizUserAnswers
     WHERE UserID = ? AND QuizName = ?
     ORDER BY SubmittedAt DESC LIMIT 1`,
    [user_id, quizName],
    (err, results) => {
      if (err) {
        console.error("DB error select QuizUserAnswers:", err);
        return res.status(500).json({ error: "DB error", details: err.message });
      }
      if (!results || !results.length) return res.status(404).json({ error: "No answers found" });

      let userAnswers = [];
      try { userAnswers = JSON.parse(results[0].Answers); } catch (e) { userAnswers = []; }

      fetchQuizQuestions(quizName, (qErr, questions) => {
        if (qErr) {
          console.error("Failed to load canonical questions:", qErr);
          return res.status(500).json({ error: "Failed to load questions" });
        }

        db.query(
          `SELECT Score, Total FROM QuizScores
           WHERE UserID = ? AND QuizName = ?
           ORDER BY ScoreID DESC LIMIT 1`,
          [user_id, quizName],
          (err2, scoreRes) => {
            if (err2) {
              console.error("DB error select QuizScores:", err2);
              return res.json({
                answerId: results[0].AnswerID,
                questions,
                userAnswers,
                score: null,
                total: null
              });
            }

            const scoreRow = (scoreRes && scoreRes[0]) ? scoreRes[0] : null;
            if (!scoreRow) {
              fetchTotalForQuiz(quizName, (tErr, totalFromQuizzes) => {
                if (tErr) {
                  console.error("Failed to compute total:", tErr);
                  return res.json({
                    answerId: results[0].AnswerID,
                    questions,
                    userAnswers,
                    score: null,
                    total: null
                  });
                }
                return res.json({
                  answerId: results[0].AnswerID,
                  questions,
                  userAnswers,
                  score: null,
                  total: totalFromQuizzes
                });
              });
            } else {
              res.json({
                answerId: results[0].AnswerID,
                questions,
                userAnswers,
                score: scoreRow.Score,
                total: scoreRow.Total
              });
            }
          }
        );
      });
    }
  );
});

/**
 * GET /user/:userId/:quizName
 * Teacher view: latest submission for specified user.
 */
router.get("/user/:userId/:quizName", authMiddleware, (req, res) => {
  const user_id = req.params.userId;
  const quizName = req.params.quizName;
  if (!user_id) return res.status(400).json({ error: "userId required" });

  db.query(
    `SELECT AnswerID, Answers, SubmittedAt
     FROM QuizUserAnswers
     WHERE UserID = ? AND QuizName = ?
     ORDER BY SubmittedAt DESC LIMIT 1`,
    [user_id, quizName],
    (err, results) => {
      if (err) {
        console.error("DB error select QuizUserAnswers (teacher):", err);
        return res.status(500).json({ error: "DB error", details: err.message });
      }
      if (!results || !results.length) return res.status(404).json({ error: "No answers found" });

      let userAnswers = [];
      try { userAnswers = JSON.parse(results[0].Answers); } catch (e) { userAnswers = []; }

      fetchQuizQuestions(quizName, (qErr, questions) => {
        if (qErr) {
          console.error("Failed to load canonical questions:", qErr);
          return res.status(500).json({ error: "Failed to load questions" });
        }

        db.query(
          `SELECT Score, Total FROM QuizScores
           WHERE UserID = ? AND QuizName = ?
           ORDER BY ScoreID DESC LIMIT 1`,
          [user_id, quizName],
          (err2, scoreRes) => {
            if (err2) {
              console.error("DB error select QuizScores (teacher):", err2);
              return res.json({
                answerId: results[0].AnswerID,
                questions,
                userAnswers,
                score: null,
                total: null
              });
            }

            const scoreRow = (scoreRes && scoreRes[0]) ? scoreRes[0] : null;
            if (!scoreRow) {
              fetchTotalForQuiz(quizName, (tErr, totalFromQuizzes) => {
                if (tErr) {
                  console.error("Failed to compute total:", tErr);
                  return res.json({
                    answerId: results[0].AnswerID,
                    questions,
                    userAnswers,
                    score: null,
                    total: null
                  });
                }
                return res.json({
                  answerId: results[0].AnswerID,
                  questions,
                  userAnswers,
                  score: null,
                  total: totalFromQuizzes
                });
              });
            } else {
              res.json({
                answerId: results[0].AnswerID,
                questions,
                userAnswers,
                score: scoreRow.Score,
                total: scoreRow.Total
              });
            }
          }
        );
      });
    }
  );
});

/**
 * POST /grade/:answerId
 * Teacher grades a submission.
 */
router.post("/grade/:answerId", authMiddleware, (req, res) => {
  const { Score } = req.body;
  const answerId = req.params.answerId;
  if (Score == null) return res.status(400).json({ error: "Missing Score" });

  db.query("SELECT UserID, QuizName FROM QuizUserAnswers WHERE AnswerID = ?", [answerId], (err, results) => {
    if (err) {
      console.error("DB error select submission for grading:", err);
      return res.status(500).json({ error: "DB error", details: err.message });
    }
    if (!results || !results.length) return res.status(404).json({ error: "Submission not found" });

    const { UserID, QuizName } = results[0];
    const normalizedScore = Number(Score);
    if (Number.isNaN(normalizedScore)) {
      return res.status(400).json({ error: "Score must be a number" });
    }

    fetchTotalForQuiz(QuizName, (tErr, total) => {
      if (tErr) {
        console.error("Failed to compute total:", tErr);
        total = 100; // default to 100 if error
      } else if (total == null) {
        total = 100; // default to 100 if no total computed
      }

      // Clamp teacher grades 0 to total
      const clampedScore = Math.max(0, Math.min(total, normalizedScore));

      const insertTotal = total;

      // Update existing score for the same user+quiz if present; otherwise insert.
      db.query(
        "UPDATE QuizScores SET Score = ?, Total = ? WHERE UserID = ? AND QuizName = ?",
        [clampedScore, insertTotal, UserID, QuizName],
        (err3, result3) => {
          if (err3) {
            console.error("DB error update QuizScores:", err3);
            return res.status(500).json({ error: "DB error", details: err3.message });
          }

          if (result3 && result3.affectedRows > 0) {
            return res.json({ message: "Score updated" });
          }

          db.query(
            "INSERT INTO QuizScores (UserID, QuizName, Score, Total) VALUES (?, ?, ?, ?)",
            [UserID, QuizName, clampedScore, insertTotal],
            (err4, result4) => {
              if (err4) {
                console.error("DB error insert QuizScores:", err4);
                return res.status(500).json({ error: "DB error", details: err4.message });
              }
              return res.json({ message: "Score saved", scoreId: result4.insertId });
            }
          );
        }
      );
    });
  });
});

module.exports = router;