import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { FaHome, FaUser, FaTachometerAlt } from 'react-icons/fa';
import { MdQuiz } from 'react-icons/md';
import axios from 'axios';
import { getActiveSession, getAuthConfig, removeSession } from '../utils/sessions';
import background from '../assets/background.jpeg';

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function Layout() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = decodeJwtPayload(active.token);
      const userId = decoded?.UserID;
      if (!userId) {
        setUsername(active.userName || '');
        return;
      }

      axios
        .get(`http://localhost:8000/api/users/viewuser/${userId}`, getAuthConfig())
        .then((res) => {
          const data = res.data || {};
          setUsername(data.UserName || active.userName || '');
          setFullName(
            `${data.FirstName || ''} ${data.MiddleName || ''} ${data.LastName || ''}`.replace(/\s+/g, ' ').trim()
          );
        })
        .catch(() => {
          setUsername(active.userName || '');
        });
    } catch (error) {
      console.error('Token error:', error);
      removeSession(active.id);
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    const active = getActiveSession();
    if (active?.id) removeSession(active.id);
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen p-8"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <nav className="flex items-center justify-between bg-white/80 backdrop-blur-md shadow-lg rounded-2xl px-8 py-4 mb-10 border border-slate-300">
        {/* Left side links */}
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-semibold transition-colors"
          >
            <FaTachometerAlt /> Dashboard
          </Link>
          <Link
            to="/home"
            className="flex items-center gap-2 text-orange-600 hover:text-orange-800 font-semibold transition-colors"
          >
            <FaHome /> About
          </Link>
          <Link
            to="/quizzes"
            className="flex items-center gap-2 text-cyan-700 hover:text-cyan-900 font-semibold transition-colors"
          >
            <MdQuiz /> Quizzes
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 font-semibold transition-colors"
          >
            <FaUser /> Profile
          </Link>
        </div>

        {/* Right side: Welcome + Logout */}
        <div className="flex items-center gap-4">
          {username && (
            <span className="text-slate-800 font-medium">
              Welcome,{" "}
              <span className="font-semibold text-emerald-700">
                {username}
              </span>
              {fullName && (
                <span className="text-slate-600">
                  {" "}({fullName})
                </span>
              )}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white py-2 px-5 rounded-lg shadow-md transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
