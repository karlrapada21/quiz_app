// ...existing code...
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { addSession } from "../utils/sessions";
import flcLogoSrc from "../assets/flc_logo.png";

function Login() {
  const [formdata, setFormData] = useState({
    UserName: "",
    Password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/users/loginuser", formdata);
      const token = res.data?.token || res.data?.accessToken || res.data?.data?.token;
      const role = res.data?.role || res.data?.data?.role || "student";
      const userId = res.data?.userId || res.data?.data?.userId || null;
      const username = res.data?.userName || res.data?.username || res.data?.UserName || formdata.UserName;

      if (!token) {
        setError("No token returned from server.");
        setLoading(false);
        return;
      }

      addSession({ userName: username, token, role, userId });

      if ((role || "student") === "teacher") navigate("/teacher/teacherusers");
      else navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "An error occurred while logging in.";
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 relative overflow-hidden">
      {/* subtle blurred circles */}
      <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
      <div className="absolute w-72 h-72 bg-cyan-300/20 rounded-full blur-3xl bottom-10 right-10 animate-pulse"></div>

      <div className="relative bg-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-white/20">
        {/* Left side */}
        <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-10 text-white bg-gradient-to-b from-teal-600/80 to-cyan-700/60">
          <img
            src={flcLogoSrc}
            alt="FLC Logo"
            onError={(e) => (e.currentTarget.src = "/flc_logo.png")}
            className="max-w-xs w-48 h-auto object-contain drop-shadow-lg mb-6"
          />
          <h2 className="text-2xl font-bold tracking-wide">Grade 6 Science Quiz App</h2>
          <p className="text-sm mt-3 text-white/80 text-center px-8">
            With performance-based difficulty visualization system.
          </p>
        </div>

        {/* Right side (Form) */}
        <div className="w-full md:w-1/2 p-10 bg-white/70 backdrop-blur-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-slate-800">Welcome Back</h1>
            <p className="text-slate-600 text-sm mt-2">Log in to continue</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                name="UserName"
                placeholder="Enter your username"
                required
                value={formdata.UserName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-slate-300 focus:ring-4 focus:ring-teal-400 focus:outline-none shadow-sm transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                name="Password"
                placeholder="••••••••"
                required
                value={formdata.Password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-slate-300 focus:ring-4 focus:ring-teal-400 focus:outline-none shadow-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {error && <div className="mt-4 text-sm text-red-600 text-center">{error}</div>}

          <div className="text-center mt-4">
            <Link to="/forgotpassword" className="text-sm text-teal-600 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-4 text-center w-full text-white/80 text-xs">
       Quiz App
      </footer>
    </div>
  );
}

export default Login;
// ...existing code...
