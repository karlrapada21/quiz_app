import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig, getActiveSession } from '../utils/sessions';

const parseJSON = (value) => {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

function getUserIdFromSession() {
  const active = getActiveSession();
  return active?.UserID ?? active?.userId ?? null;
}

function UnifiedQuiz() {
  const { quizName: quizNameParam } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const quizName = decodeURIComponent(quizNameParam);

  useEffect(() => {
    let mounted = true;
    if (!quizName) {
      setError('Invalid quiz name: ' + quizName);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get(
          `/api/quizzes/questions?quiz=${encodeURIComponent(quizName)}`,
          getAuthConfig()
        );
        if (!mounted) return;

        const rawQuestions = Array.isArray(res.data?.questions)
          ? res.data.questions
          : Array.isArray(res.data)
          ? res.data
          : [];

        const normalized = rawQuestions.map((q) => {
          const optionsRaw = q.options ?? q.OptionsJSON ?? null;
          const rawAnswer = q.answer ?? q.AnswerJSON ?? q.Answer ?? null;

          let answer = parseJSON(rawAnswer);
          if (Array.isArray(answer)) {
            answer = answer.map((v) => (typeof v === 'string' && v.trim() !== '' && !isNaN(v) ? Number(v) : v));
          } else if (typeof answer === 'string' && !isNaN(answer)) {
            answer = Number(answer);
          }

          return {
            id: q.id ?? q.QuestionID ?? null,
            quizName: q.quizName ?? q.QuizName ?? quizName,
            question: q.question ?? q.QuestionText ?? q.Question ?? '',
            options: Array.isArray(optionsRaw) ? optionsRaw : parseJSON(optionsRaw) || [],
            answer: answer,
            total: Number(q.total ?? q.TotalPoints ?? 1),
            type: q.type ?? q.QuestionType ?? 'multiple-choice'
          };
        });

        setQuestions(normalized);
        setCurrent(0);
        setSelectedIndex(null);
        setSelectedIndexes([]);
        setTextAnswer('');
        setScore(0);
        setUserAnswers([]);
      } catch (err) {
        console.error('Failed to load quiz questions', err?.response?.data || err?.message || err);
        if (mounted) setError('Failed to load quiz questions. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [quizName]);

  const saveScore = async (finalScore, total) => {
    try {
      await axios.post(
        '/api/quiz_scores/add',
        {
          QuizName: quizName,
          Score: finalScore,
          Total: total,
          UserID: getUserIdFromSession()
        },
        getAuthConfig()
      );
    } catch (err) {
      console.error('Failed to save score', err?.response?.data || err?.message || err);
    }
  };

  const saveAnswers = async (answersArr) => {
    const userId = getUserIdFromSession();
    console.log('UserID:', userId, 'QuizName:', quizName, 'Answers:', answersArr);
    if (!userId) {
      console.error('No user ID, not saving answers');
      return;
    }
    try {
      await axios.post(
        '/api/quiz_answers/submit',
        {
          QuizName: quizName,
          Answers: answersArr,
          UserID: userId
        },
        getAuthConfig()
      );
    } catch (err) {
      console.error('Failed to save answers', err?.response?.data || err?.message || err);
    }
  };

  const handleCheckboxToggle = (idx) => {
    setSelectedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleNext = async () => {
    if (!questions[current]) return;

    const currentType = questions[current].type;
    let currentScore = 0;
    let answerPayload = null;

    if (currentType === 'open-ended') {
      if (textAnswer.trim() === '') return;
      answerPayload = textAnswer.trim();
      // open-ended questions are not case-scored here
    } else if (currentType === 'identification') {
      const given = textAnswer.trim();
      answerPayload = given;
      const expected = String(questions[current].answer ?? '').trim().toLowerCase();
      if (expected !== '' && given.toLowerCase() === expected) currentScore = 1;
    } else {
      // multiple-choice / checkbox (multi-select)
      if (Array.isArray(questions[current].answer)) {
        if (selectedIndexes.length === 0) return;
        answerPayload = [...selectedIndexes];
        const correct = Array.isArray(questions[current].answer)
          ? questions[current].answer.map((v) => Number(v)).sort()
          : [Number(questions[current].answer)];
        const submitted = [...selectedIndexes].map(Number).sort();
        if (JSON.stringify(correct) === JSON.stringify(submitted)) currentScore = 1;
      } else {
        if (selectedIndex === null || selectedIndex === undefined) return;
        answerPayload = selectedIndex;
        const correctArr = Array.isArray(questions[current].answer)
          ? questions[current].answer.map((v) => Number(v))
          : [Number(questions[current].answer)];
        if (correctArr.includes(Number(selectedIndex))) currentScore = 1;
      }
    }

    const nextAnswers = [...userAnswers, answerPayload];
    setUserAnswers(nextAnswers);
    setScore((s) => s + currentScore);

    const isLast = current + 1 >= questions.length;
    if (isLast) {
      if (currentType !== 'open-ended') {
        await saveScore(score + currentScore, questions.length);
      }
      await saveAnswers(nextAnswers);
      setShowResult(true);
    } else {
      setCurrent((c) => c + 1);
      setSelectedIndex(null);
      setSelectedIndexes([]);
      setTextAnswer('');
    }
  };

  const isNextDisabled = () => {
    if (!questions[current]) return true;
    const currentType = questions[current].type;
    if (currentType === 'open-ended' || currentType === 'identification') {
      return textAnswer.trim() === '';
    }
    if (Array.isArray(questions[current].answer)) {
      return selectedIndexes.length === 0;
    }
    return selectedIndex === null || selectedIndex === undefined;
  };

  const handleExit = () => navigate('/quizzes');

  if (loading) return <div className="text-center mt-12 text-slate-500">Loading...</div>;
  if (error) return <div className="text-center mt-12 text-red-500">{error}</div>;
  if (questions.length === 0) return <div className="text-center mt-12 text-slate-500">No questions available for this quiz.</div>;

  if (showResult) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200 text-center">
          <h2 className="text-2xl font-semibold mb-4">{quizName} Complete!</h2>
          <p className="mb-6 text-lg text-slate-700">
            {questions.length > 0 && questions[0].type === 'open-ended'
              ? 'Answers submitted for teacher grading.'
              : `Your score: ${score} / ${questions.length}`}
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={handleExit} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition duration-200">
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-semibold mb-6">{quizName}</h2>
        <div className="mb-6">
          <span className="text-slate-600">Question {current + 1} of {questions.length}</span>
          <p className="mt-2 text-lg font-medium text-slate-800">{q.question || 'Question not available'}</p>
        </div>

        {q.type === 'open-ended' ? (
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none mb-6"
            rows={6}
            placeholder="Type your response here..."
          />
        ) : q.type === 'identification' ? (
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none mb-6"
            placeholder="Type your answer..."
          />
        ) : Array.isArray(q.answer) ? (
          <form className="mb-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
            {(q.options || []).map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndexes.includes(idx)}
                  onChange={() => handleCheckboxToggle(idx)}
                  className="accent-blue-600"
                />
                <span className="text-slate-700">{String(option)}</span>
              </label>
            ))}
          </form>
        ) : (
          <div className="mb-6 space-y-3">
            {(q.options || []).map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`w-full text-left px-4 py-2 rounded-md border transition ${selectedIndex === idx ? 'bg-blue-100 border-blue-400' : 'bg-slate-50 border-slate-300'} hover:bg-blue-50`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleNext}
            disabled={isNextDisabled()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {current + 1 === questions.length ? (questions.length > 0 && questions[0].type === 'open-ended' ? 'Submit' : 'Finish') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnifiedQuiz;
