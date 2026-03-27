// ...existing code...
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuthConfig, getActiveSession } from '../utils/sessions';

function Users() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token) {
      navigate('/login');
      return;
    }

    const cfg = getAuthConfig();
    axios.get('http://localhost:8000/api/users/viewusers', cfg)
      .then(res => setUsers(res.data.results || []))
      .catch(err => {
        console.error('Failed to load users', err);
        setUsers([]);
        // optional: redirect on 401
        if (err?.response?.status === 401) navigate('/login');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl border border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-800 mb-6 text-center">All Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-50">
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">UserID</th>
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">Full Name</th>
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">Email</th>
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">Username</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.UserID}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-3 px-5 border-b">{user.UserID}</td>
                    <td className="py-3 px-5 border-b">{user.FullName}</td>
                    <td className="py-3 px-5 border-b">{user.Email}</td>
                    <td className="py-3 px-5 border-b">{user.UserName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Users;
// ...existing code...