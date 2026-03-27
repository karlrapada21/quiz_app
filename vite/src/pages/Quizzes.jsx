// ...existing code...
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig, getActiveSession } from '../utils/sessions';

function Quizzes() {
  const [quizLinks, setQuizLinks] = useState([]);
  const [scores, setScores] = useState({});
  const [averages, setAverages] = useState({});
  const [search, setSearch] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  // pagination: show more quizzes per page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const navigate = useNavigate();

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token) {
      navigate('/login');
      return;
    }

    const fetchQuizList = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/quizzes/list', getAuthConfig());
        const links = res.data.quizzes.map(name => ({ to: `/quiz/${encodeURIComponent(name)}`, label: name }));
        setQuizLinks(links);
      } catch (err) {
        console.error('Failed to fetch quiz list', err?.response?.data || err?.message);
        setQuizLinks([]);
      }
    };

    const fetchScores = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/quiz_scores/myscores', getAuthConfig());
        const scoreMap = {};
        if (res.data && res.data.scores) {
          res.data.scores.forEach(scoreObj => {
            scoreMap[scoreObj.QuizName] = { score: scoreObj.Score, total: scoreObj.Total };
          });
        }
        setScores(scoreMap);
      } catch (err) {
        console.error('Failed to fetch scores', err?.response?.data || err?.message);
        setScores({});
      }
    };

    const fetchAverages = async () => {
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
      } catch (err) {
        console.error('Failed to fetch averages', err?.response?.data || err?.message);
        setAverages({});
      }
    };

    fetchScores();
    fetchAverages();
    fetchQuizList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredQuizzes = quizLinks.filter(quiz =>
    quiz.label.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedQuizzes = filteredQuizzes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDifficulty = (avgFraction) => {
    if (avgFraction == null || Number.isNaN(avgFraction)) return { text: "Unknown", color: "text-gray-500" };
    if (avgFraction >= 0.8) return { text: "Easy", color: "text-green-600 font-bold" };
    if (avgFraction >= 0.5) return { text: "Medium", color: "text-yellow-600 font-bold" };
    return { text: "Hard", color: "text-red-600 font-bold" };
  };

  // load questions (use session headers). Named catch param to avoid optional catch binding issues.
  const loadQuestionsOnly = async (quizLabel) => {
    try {
      // prefer quizzes table endpoint for definitions if available
      const qRes = await axios.get(
        `http://localhost:8000/api/quizzes/questions?quiz=${encodeURIComponent(quizLabel)}`,
        getAuthConfig()
      );
      if (qRes?.data) {
        // many APIs return array or { questions: [...] }
        if (Array.isArray(qRes.data)) return qRes.data;
        if (Array.isArray(qRes.data.questions)) return qRes.data.questions;
      }

      // fallback to quiz_answers preview endpoint
      const res = await axios.get(
        `http://localhost:8000/api/quiz_answers/user/${encodeURIComponent(quizLabel)}`,
        getAuthConfig()
      );
      return res.data.questions || [];
    } catch (err) {
      console.warn('Failed to load questions for', quizLabel, err?.response?.data || err?.message);
      return [];
    }
  };

  const handleQuizClick = async (quiz) => {
    const submitted = !!scores[quiz.label];
    if (submitted) {
      const questions = await loadQuestionsOnly(quiz.label);
      setResultData({
        quiz: quiz.label,
        submitted: true,
        score: scores[quiz.label].score,
        total: scores[quiz.label].total,
        questions
      });
      setShowResult(true);
    } else {
      navigate(quiz.to);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setResultData(null);
  };

  return (
    <div className="relative flex justify-center min-h-screen px-6 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-7xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-semibold text-slate-800">Grade 6 Science Quizzes</h2>
            <p className="text-sm text-slate-600">Choose a quiz to begin:</p>
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
                      onClick={() => handleQuizClick(quiz)}
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

      {/* Questions-only modal */}
      {showResult && resultData && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-xl shadow-2xl p-8 border border-slate-300 text-left max-w-4xl w-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{resultData.quiz}</h3>
                {resultData.submitted ? (
                  <p className="text-sm text-slate-600">Submitted — Score: <span className="font-bold">{resultData.score}</span> / {resultData.total}</p>
                ) : (
                  <p className="text-sm text-slate-600">Preview only — not submitted</p>
                )}
              </div>
            </div>

            <div className="mb-4 max-h-80 overflow-y-auto">
              {resultData.questions && resultData.questions.length > 0 ? (
                resultData.questions.map((q, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="font-medium">{idx + 1}. {q?.question ?? String(q)}</div>
                    {Array.isArray(q?.options) && (
                      <div className="text-sm text-slate-500 mt-1">Options: {q.options.join(', ')}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Questions not available. Start the quiz to view questions.</div>
              )}
            </div>

            <div className="text-right">
              <button onClick={handleCloseResult} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quizzes;
// ...existing code...