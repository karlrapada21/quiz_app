import React from 'react';
import { getActiveSession } from '../utils/sessions';

function Home() {
  const active = getActiveSession();

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-slate-800">Welcome to Quiz App</h1>
        {active && active.userName && (
          <p className="text-slate-600 mt-2">
            Signed in as <span className="font-semibold text-blue-700">{active.userName}</span>
          </p>
        )}
      </header>

      <section className="bg-white/80 rounded-xl shadow-md p-4 border border-slate-200 max-w-2xl w-full text-center">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">About the Quiz App</h2>
        <p className="text-slate-600 text-lg">
          Efficiency is one of the keys to a proper teaching process.
        </p>
        <p className="text-slate-600 text-lg mt-4">
          With the use of the quiz app, Grade 6 Science teachers of JCSRC Foundational Learning Center Inc.
          will have an easier way of giving quizzes. Grade 6 students will also be more prepared with their quizzes 
          because of the visual difficulty indicator. While eliminating errors from erasures and miscalculation of grades 
          and being able to access quizzes anytime. Making quizzes efficient and convenient.
        </p>
      </section>

      <footer className="mt-8 text-center text-xs text-slate-500">
        Quiz App
      </footer>
    </div>
  );
}

export default Home;
