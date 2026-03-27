import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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

function TeacherLayout() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token || active.role !== 'teacher') {
      navigate('/login');
      return;
    }

    try {
      const decoded = decodeJwtPayload(active.token);
      const teacherId = decoded?.UserID;

      if (!teacherId) {
        setUsername(active.userName || 'Teacher');
        return;
      }

      axios
        .get(`http://localhost:8000/api/users/viewuser/${teacherId}`, getAuthConfig())
        .then((res) => {
          const user = res.data || {};
          const name = user.UserName || user.Email || active.userName || 'Teacher';
          setUsername(name);

          setFullName(
            `${user.FirstName || ''} ${user.MiddleName || ''} ${user.LastName || ''}`
              .replace(/\s+/g, ' ')
              .trim()
          );
        })
        .catch(() => setUsername(active.userName || 'Teacher'));
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

  const handleAddUser = () => {
    navigate('/teacher/register');
  };

  const handleProfile = () => {
    navigate('/teacher/profile');
  };

  const handleUsers = () => {
    navigate('/teacher/teacherusers');
  };

  return (
    <div
      className="min-h-screen px-4"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <nav className="flex justify-between items-center bg-white/80 backdrop-blur-md shadow-lg px-8 py-4 mb-8 rounded-2xl border border-slate-300">
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">Quiz App</h1>

        <div className="flex items-center gap-4">
          <span className="text-slate-800 font-medium">
            Welcome Teacher,{' '}
            <span className="font-semibold text-emerald-700">
              {username || 'Teacher'}
            </span>
            {fullName && (
              <span className="text-slate-600">
                {' '}({fullName})
              </span>
            )}
          </span>

          <button
            onClick={handleProfile}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all"
          >
            Profile
          </button>

          <button
            onClick={handleUsers}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all"
          >
            Users
          </button>

          <button
            onClick={handleAddUser}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all"
          >
            Add User
          </button>

          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

export default TeacherLayout;
