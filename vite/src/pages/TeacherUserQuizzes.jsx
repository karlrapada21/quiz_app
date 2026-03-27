// ...existing code...
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig, getActiveSession } from '../utils/sessions';

function TeacherUserQuizzes() {
  const { userId } = useParams();
  const [scores, setScores] = useState({});
  const [averages, setAverages] = useState({});
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [openSubmission, setOpenSubmission] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  const navigate = useNavigate();

  const quizLinks = [
    { label: "Multiple Choice Quiz" },
    { label: "Identification Quiz" },
    { label: "Checkbox Quiz" },
    { label: "Open Ended Quiz" },
    { label: "Q1 Check Your Knowledge 1" },
    { label: "Q1 Check Your Knowledge 2" },
    { label: "Q1 Check Your Knowledge 3" },
    { label: "Q2 Check Your Knowledge 1" },
    { label: "Q3 Check Your Knowledge 1" },
    { label: "Q3 Check Your Knowledge 2" },
    { label: "Q3 Check Your Knowledge 3" },
    { label: "Q3 Check Your Understanding 1" },
    { label: "Q4 Check Your Knowledge 1" },
    { label: "Q4 Check Your Knowledge 2" },
    { label: "Q4 Process What You Know 1" },
    { label: "Q4 Process What You Know 2" }
  ];

  const manualCheckQuizzes = new Set([
    "Open Ended Quiz",
    "Q3 Check Your Understanding 1",
    "Q4 Process What You Know 2"
  ]);

  // pagination: increase items per page to show more quizzes
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const refreshAverages = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/quiz_scores/averages');
      const avgMap = {};
      if (res.data && Array.isArray(res.data.averages)) {
        const parseNum = v => {
          if (v == null) return NaN;
          const n = Number(v);
          return Number.isFinite(n) ? n : NaN;
        };

        res.data.averages.forEach(avgObj => {
          let frac = null;
          const rawPercent = parseNum(avgObj.avgPercent);
          if (!Number.isNaN(rawPercent)) {
            frac = rawPercent > 1 ? rawPercent / 100 : rawPercent;
          } else {
            const avgScore = parseNum(avgObj.avgScore);
            const avgTotal = parseNum(avgObj.avgTotal);
            if (!Number.isNaN(avgScore) && !Number.isNaN(avgTotal) && avgTotal > 0) {
              frac = avgScore / avgTotal;
            }
          }

          if (typeof frac === 'number' && !Number.isNaN(frac)) {
            frac = Math.max(0, Math.min(1, frac));
            avgMap[avgObj.QuizName] = frac;
          } else {
            avgMap[avgObj.QuizName] = null;
          }
        });
      }
      setAverages(avgMap);
    } catch (error) {
      console.warn('Failed to load averages', error);
      setAverages({});
    }
  };

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token || active.role !== 'teacher') {
      navigate('/login');
      return;
    }

    axios
      .get(`http://localhost:8000/api/users/viewuser/${userId}`, getAuthConfig())
      .then(res => setUser(res.data))
      .catch(() => setUser(null));

    const loadScores = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/quiz_scores/user/${userId}`, getAuthConfig());
        const scoreMap = {};
        if (res.data && res.data.scores) {
          res.data.scores.forEach(scoreObj => {
            scoreMap[scoreObj.QuizName] = { score: scoreObj.Score, total: scoreObj.Total };
          });
        }
        setScores(scoreMap);
      } catch (err) {
        console.warn('Failed to load user quiz scores', err);
        setScores({});
      }
    };

    loadScores();
    refreshAverages();
  }, [userId, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredQuizzes = quizLinks.filter(q => q.label.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedQuizzes = filteredQuizzes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = page => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const normalizeQuestionsFromQuizzes = raw => {
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : (Array.isArray(raw.questions) ? raw.questions : (raw.quiz?.questions || raw.data?.questions || []));
    return arr.map(q => {
      let options = [];
      try {
        if (Array.isArray(q.options)) options = q.options;
        else if (q.OptionsJSON) options = JSON.parse(q.OptionsJSON);
        else if (q.Options) options = q.Options;
      } catch (e) {
        console.warn('Failed to parse question options', e);
        options = [];
      }
      return {
        id: q.id ?? q.ID ?? null,
        quizName: q.quizName || q.QuizName || q.Quiz || '',
        question: q.question || q.QuestionText || q.text || '',
        options,
        answer: q.answer ?? q.answers ?? q.Answer ?? q.Answers ?? null,
        total: q.total ?? q.Total ?? 1,
        type: q.type || q.QuestionType || (Array.isArray(options) ? (options.length > 1 ? 'multiple-choice' : 'single') : 'open-ended')
      };
    });
  };

  const handleCheckOpenEnded = async quizLabel => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/quiz_answers/user/${userId}/${encodeURIComponent(quizLabel)}`,
        getAuthConfig()
      );

      const questions = res.data.questions || [];
      const answers = res.data.userAnswers || [];
      const answerId = res.data.answerId ?? null;
      const total = res.data.total ?? (Array.isArray(questions) ? questions.reduce((s, q) => s + (Number(q.total) || 0), 0) : null);

      setOpenSubmission({ questions, answers, answerId, total, quizLabel });
      setScoreInput('');
      setShowAnswer(true);
    } catch (err) {
      console.error('Check fetch error', err?.response?.data || err.message);
      setOpenSubmission({ questions: [], answers: [], answerId: null, total: null, quizLabel });
      setScoreInput('');
      setShowAnswer(true);
    }
  };

  const handleSaveScore = async () => {
    if (!openSubmission || !openSubmission.answerId) {
      alert('No submission selected to grade.');
      return;
    }
    if (scoreInput === '') {
      alert('Enter a score before saving.');
      return;
    }
    const numericScore = Number(scoreInput);
    if (Number.isNaN(numericScore)) {
      alert('Score must be a number.');
      return;
    }

    try {
      await axios.post(
        `http://localhost:8000/api/quiz_answers/grade/${openSubmission.answerId}`,
        { Score: numericScore },
        getAuthConfig()
      );
      alert('Score saved!');

      const res = await axios.get(`http://localhost:8000/api/quiz_scores/user/${userId}`, getAuthConfig());
      const scoreMap = {};
      if (res.data && res.data.scores) {
        res.data.scores.forEach(scoreObj => {
          if (!scoreMap[scoreObj.QuizName]) {
            scoreMap[scoreObj.QuizName] = { score: scoreObj.Score, total: scoreObj.Total };
          }
        });
      }
      setScores(scoreMap);

      await refreshAverages();

      setShowAnswer(false);
      setOpenSubmission(null);
      setScoreInput('');
    } catch (err) {
      console.error('Save score error', err?.response?.data || err.message);
      alert('Failed to save score.');
    }
  };

  const handleCancelGrade = () => {
    setShowAnswer(false);
    setOpenSubmission(null);
    setScoreInput('');
  };

  const handleQuizClick = async quizLabel => {
    let questions = [];
    let userAnswers = [];
    let score = scores[quizLabel]?.score;
    let total = scores[quizLabel]?.total;
    let error = null;
    let isSubmitted = false;

    try {
      const res = await axios.get(
        `http://localhost:8000/api/quizzes/questions?quiz=${encodeURIComponent(quizLabel)}`,
        getAuthConfig()
      );
      questions = normalizeQuestionsFromQuizzes(res.data);
    } catch (err) {
      console.warn('First quiz load attempt failed', err);
      try {
        const res2 = await axios.get(
          `http://localhost:8000/api/quizzes/${encodeURIComponent(quizLabel)}`,
          getAuthConfig()
        );
        questions = normalizeQuestionsFromQuizzes(res2.data);
      } catch (err2) {
        console.warn('Second quiz load attempt failed', err2);
        try {
          const fb = await axios.get(
            `http://localhost:8000/api/quiz_answers/user/${encodeURIComponent(quizLabel)}`,
            getAuthConfig()
          );
          questions = normalizeQuestionsFromQuizzes(fb.data);
        } catch (fbErr) {
          console.warn('Could not load quiz definition', fbErr?.response?.data || fbErr?.message);
          error = 'Could not load quiz preview.';
        }
      }
    }

    try {
      const sres = await axios.get(
        `http://localhost:8000/api/quiz_answers/user/${userId}/${encodeURIComponent(quizLabel)}`,
        getAuthConfig()
      );
      if (Array.isArray(sres.data.questions) && sres.data.questions.length > 0) {
        const subQs = normalizeQuestionsFromQuizzes(sres.data);
        questions = subQs.length > 0 ? subQs : questions;
      }
      userAnswers = Array.isArray(sres.data.userAnswers) ? sres.data.userAnswers : (sres.data.userAnswers ? [sres.data.userAnswers] : []);
      score = score ?? sres.data.score ?? sres.data.Score;
      total = total ?? sres.data.total ?? sres.data.Total;
      isSubmitted = (userAnswers && userAnswers.length > 0) || (score != null && score !== undefined);
    } catch (serr) {
      console.info('No student submission found; showing preview.', serr?.response?.status || serr?.message);
    }

    questions = Array.isArray(questions) ? questions : [];
    userAnswers = Array.isArray(userAnswers) ? userAnswers : [];

    setResultData({ quiz: quizLabel, questions, userAnswers, score, total, error, isSubmitted });
    setShowResult(true);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setResultData(null);
  };

  const getDifficulty = avgFraction => {
    if (avgFraction == null || Number.isNaN(avgFraction)) return { text: 'Unknown', color: 'text-gray-500' };
    if (avgFraction >= 0.8) return { text: 'Easy', color: 'text-green-600 font-bold' };
    if (avgFraction >= 0.5) return { text: 'Medium', color: 'text-yellow-600 font-bold' };
    return { text: 'Hard', color: 'text-red-600 font-bold' };
  };

  return (
    <div className="relative flex justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 px-6 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-7xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {user ? `${user.FirstName || ''} ${user.MiddleName || ''} ${user.LastName || ''}'s Quizzes` : 'Loading...'}
            </h2>
            <Link to="/teacher/teacherusers" className="text-blue-600 hover:underline text-sm">← Back to Users</Link>
          </div>

          <div className="w-1/3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {/* quizzes grid: responsive, shows more items on wider screens */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedQuizzes.length === 0 ? (
            <li className="text-slate-500">No quizzes found.</li>
          ) : (
            displayedQuizzes.map((quiz, idx) => {
              const avg = averages[quiz.label];
              const difficulty = getDifficulty(avg);
              return (
                <li key={startIndex + idx} className="flex items-center justify-between bg-blue-50 border border-slate-200 rounded-md p-3">
                  <div className="flex-1 text-left">
                    <button
                      type="button"
                      onClick={() => handleQuizClick(quiz.label)}
                      className="w-full text-left font-semibold text-slate-800"
                    >
                      {quiz.label}
                    </button>
                    <div className="mt-2 text-sm text-slate-600">
                      {scores[quiz.label] ? `${scores[quiz.label].score} / ${scores[quiz.label].total}` : 'No score yet'}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className={`text-sm ${difficulty.color}`}>{difficulty.text}</div>
                    {manualCheckQuizzes.has(quiz.label) && (
                      <button
                        onClick={() => handleCheckOpenEnded(quiz.label)}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded"
                      >
                        Check
                      </button>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {/* pagination controls */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'}`}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-700 text-white' : 'bg-white border'}`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'}`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Grading Modal for open-ended submissions */}
      {showAnswer && openSubmission && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-black/40 absolute inset-0" onClick={handleCancelGrade}></div>
          <div className="relative pointer-events-auto bg-white rounded-xl shadow-2xl p-6 border border-slate-300 max-w-4xl w-full z-10">
            <h3 className="text-xl font-semibold mb-3">Grade: {openSubmission.quizLabel}</h3>
            <p className="mb-4 text-sm text-slate-600">AnswerID: {openSubmission.answerId ?? 'N/A'} — Total possible: {openSubmission.total ?? 'N/A'}</p>

            <div className="mb-4 max-h-72 overflow-y-auto text-left">
              {(openSubmission.questions && openSubmission.questions.length > 0) ? (
                openSubmission.questions.map((q, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="font-medium">{idx + 1}. {q.question || q}</div>
                    <div className="text-sm text-slate-700 mt-1">
                      Student answer:{" "}
                      <span className="text-slate-900">
                        {Array.isArray(openSubmission.answers[idx])
                          ? openSubmission.answers[idx].join(', ')
                          : (openSubmission.answers[idx] ?? 'No answer')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">No submission content.</div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium">Score</label>
              <input
                type="number"
                value={scoreInput}
                onChange={e => setScoreInput(e.target.value)}
                placeholder="Enter numeric score"
                className="px-3 py-2 border rounded w-32"
                min="0"
                max={openSubmission.total}
              />
              <span className="text-sm text-slate-600">/ {openSubmission.total ?? 'N/A'}</span>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleCancelGrade} className="px-4 py-2 rounded bg-slate-200">Cancel</button>
              <button onClick={handleSaveScore} className="px-4 py-2 rounded bg-green-600 text-white">Save Score</button>
            </div>
          </div>
        </div>
      )}

      {/* Result / Preview Modal */}
      {showResult && resultData && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-xl shadow-2xl p-8 border border-slate-300 text-center max-w-4xl w-full">
            <h3 className="text-xl font-semibold mb-3">{resultData.quiz}</h3>

            {resultData.error && <div className="text-red-600 mb-4">{resultData.error}</div>}

            <p className="mb-2 text-slate-700">
              <span className="font-bold text-blue-600">
                {resultData.isSubmitted ? 'Submission' : 'Preview — Quiz Questions & Correct Answers'}
              </span>
            </p>

            <p className="mb-4 text-lg text-slate-700">
              Score: <span className="font-bold">{resultData.score != null ? resultData.score : 'N/A'}</span> /
              <span className="font-bold"> {resultData.total != null ? resultData.total : 'N/A'}</span>
            </p>

            {resultData.questions && resultData.questions.length > 0 ? (
              <div className="mb-6 text-left max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-2">
                  {resultData.isSubmitted ? "Student's Answers & Correct Answers:" : "Correct Answers:"}
                </h3>

                {resultData.questions.map((q, idx) => {
                  const studentRaw = resultData.userAnswers && resultData.userAnswers[idx];
                  const studentArr = Array.isArray(studentRaw) ? [...studentRaw].sort() : (studentRaw !== undefined && studentRaw !== null ? [studentRaw] : []);
                  const correctArr = Array.isArray(q.answer) ? [...q.answer].sort() : (q.answer !== undefined && q.answer !== null ? [q.answer] : []);
                  const isCorrect = JSON.stringify(studentArr) === JSON.stringify(correctArr);

                  const renderStudent = () => {
                    if (!studentArr || studentArr.length === 0) return 'No answer';
                    if (Array.isArray(q.options) && q.options.length > 0) {
                      return studentArr.map(i => (q.options && q.options[i] !== undefined) ? q.options[i] : i).join(', ');
                    }
                    return studentArr.join(', ');
                  };

                  const renderCorrect = () => {
                    if (!correctArr || correctArr.length === 0) return 'N/A';
                    if (Array.isArray(q.options) && q.options.length > 0) {
                      return correctArr.map(i => (q.options && q.options[i] !== undefined) ? q.options[i] : i).join(', ');
                    }
                    return correctArr.join(', ');
                  };

                  return (
                    <div key={idx} className="mb-3">
                      <div className="font-medium">{idx + 1}. {q.question}</div>

                      {resultData.isSubmitted ? (
                        <>
                          <div>
                            Student's answer:{' '}
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {renderStudent()}
                            </span>
                          </div>
                          <div>
                            Correct answer:{' '}
                            <span className="text-green-600">
                              {renderCorrect()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div>
                          Correct answer:{' '}
                          <span className="text-green-600">
                            {renderCorrect()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-500 mb-4">No questions available for this quiz.</div>
            )}

            <button onClick={handleCloseResult} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition duration-200">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherUserQuizzes;
// ...existing code...