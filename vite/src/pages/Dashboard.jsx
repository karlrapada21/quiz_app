import React, { useEffect } from 'react';
import science_logo from '../assets/science_logo.png';
import { getActiveSession } from '../utils/sessions';

function Dashboard() {
  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen  p-8 flex flex-col items-center">
      <header className="mb-10 text-center text-3xl">
        <p className="text-slate-1000 mt-2">
          Welcome to the Quiz App Dashboard, for Grade 6 Science Quizzes.
        </p>
      </header>

      <div className="flex justify-center items-center w-full mb-10">
        <img
          src={science_logo}
          alt="Science Logo"
          className="mx-auto"
          style={{ width: 250, height: 250 }}
        />
      </div>

      <footer className="mt-10 text-center text-3xl text-slate-1000">
        Quiz App
      </footer>
    </div>
  );
}

export default Dashboard;