import React, { useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from "../utils/sessions";

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // include auth config if an active session exists (harmless otherwise)
      await axios.post('/api/users/forgotpassword', { email }, getAuthConfig());
      setMessage('If this email exists, a password reset link has been sent.');
    } catch (err) {
      console.warn('ForgotPassword request failed', err);
      setMessage('If this email exists, a password reset link has been sent.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-semibold mb-6 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-slate-700 font-medium">Enter your email address</label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-slate-300 rounded-md mb-4"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition duration-200"
          >
            Send Reset Link
          </button>
        </form>
        {message && <div className="mt-4 text-center text-slate-600">{message}</div>}
      </div>
    </div>
  );
}

export default ForgotPassword;