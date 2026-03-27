// ...existing code...
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getActiveSession, getAuthConfig } from '../utils/sessions';

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

function Profile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token) {
      navigate('/login');
      return;
    }

    const decoded = decodeJwtPayload(active.token);
    const userId = decoded?.UserID || decoded?.userId || decoded?.id;

    if (userId) {
      axios.get(`/api/users/viewuser/${userId}`, getAuthConfig())
        .then(res => setProfile(res.data))
        .catch(() => {
          // fallback to minimal profile from session
          setProfile({
            UserName: active.userName || '',
            Email: active.meta?.email || ''
          });
        });
    } else {
      // no userId in token: use session info as fallback
      setProfile({
        UserName: active.userName || '',
        Email: active.meta?.email || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200 text-center">
        <span className="text-slate-500">Loading profile...</span>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-800 mb-6 text-center">User Profile</h2>
        <div className="space-y-4">
          <div>
            <span className="block text-slate-500 text-sm">Full Name</span>
            <span className="block text-lg font-medium text-slate-700">
              {profile.FirstName || profile.UserName || ''}{profile.MiddleName ? ` ${profile.MiddleName}` : ''}{profile.LastName ? ` ${profile.LastName}` : ''}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 text-sm">Email</span>
            <span className="block text-lg font-medium text-slate-700">{profile.Email || ''}</span>
          </div>
          <div>
            <span className="block text-slate-500 text-sm">Username</span>
            <span className="block text-lg font-medium text-slate-700">{profile.UserName || ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;