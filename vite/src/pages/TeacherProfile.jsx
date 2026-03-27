import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getActiveSession, getAuthConfig } from '../utils/sessions';

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // handle url-safe base64 and pad
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token || active.role !== 'teacher') {
      navigate('/login');
      return;
    }

    const decoded = decodeJwtPayload(active.token);
    // try several possible id sources
    const teacherId =
      decoded?.UserID ||
      decoded?.userId ||
      active.meta?.UserID ||
      active.meta?.userId ||
      null;

    if (!teacherId) {
      // fallback to meta/userName if server token doesn't include ID
      setProfile({
        UserID: null,
        FirstName: active.meta?.FirstName || '',
        MiddleName: active.meta?.MiddleName || '',
        LastName: active.meta?.LastName || '',
        UserName: active.userName || '',
        Email: active.meta?.email || active.meta?.Email || '',
      });
      return;
    }

    axios
      .get(`http://localhost:8000/api/users/viewuser/${teacherId}`, getAuthConfig())
      .then((res) => {
        const user = res.data?.user || res.data?.results?.[0] || res.data || null;
        setProfile(user);
      })
      .catch(() => {
        // if fetch fails, still provide minimal profile so UI doesn't break
        setProfile({
          UserID: teacherId,
          UserName: active.userName || '',
          Email: active.meta?.email || '',
        });
      });
  }, [navigate]);

  if (!profile)
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200 text-center">
          <span className="text-slate-500">Loading profile...</span>
        </div>
      </div>
    );

  const editId = profile?.UserID || profile?.id || null;
  const canEdit = Boolean(editId);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-800 mb-6 text-center">Teacher Profile</h2>

        <div className="space-y-4">
          <div>
            <span className="block text-slate-500 text-sm">Full Name</span>
            <span className="block text-lg font-medium text-slate-700">
              {profile.FirstName || ''} {profile.MiddleName ? profile.MiddleName + ' ' : ''}{profile.LastName || ''}
            </span>
          </div>

          <div>
            <span className="block text-slate-500 text-sm">Email</span>
            <span className="block text-lg font-medium text-slate-700">{profile.Email}</span>
          </div>

          <div>
            <span className="block text-slate-500 text-sm">Username</span>
            <span className="block text-lg font-medium text-slate-700">{profile.UserName}</span>
          </div>
        </div>

        <button
          onClick={() => canEdit && navigate(`/teacher/editprofile/${editId}`)}
          disabled={!canEdit}
          className={`mt-8 w-full font-semibold py-2 rounded-lg transition duration-200 ${canEdit ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
          title={canEdit ? 'Edit Profile' : 'Cannot edit: missing user id'}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

export default TeacherProfile;