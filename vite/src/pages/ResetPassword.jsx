import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getAuthConfig } from "../utils/sessions";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const type = searchParams.get("type");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      // support optional active session headers (no harm if none)
      await axios.post(
        "/api/users/resetpassword",
        { token, newPassword },
        getAuthConfig()
      );
      setMessage("Password has been reset. You can now log in.");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      console.warn('ResetPassword request failed', err);
      setMessage("Invalid or expired token.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-semibold mb-6 text-center">Reset Password {type === "teacher" ? "(Teacher)" : ""}</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-slate-700 font-medium">Enter your new password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-slate-300 rounded-md mb-4"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md">Reset Password</button>
        </form>
        {message && <div className="mt-4 text-center text-slate-600">{message}</div>}
      </div>
    </div>
  );
}

export default ResetPassword;