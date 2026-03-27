import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getActiveSession, getAuthConfig } from "../utils/sessions";

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function TeacherEditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    FirstName: "",
    MiddleName: "",
    LastName: "",
    Email: "",
    UserName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token || active.role !== "teacher") {
      navigate("/login");
      return;
    }

    const decoded = decodeJwtPayload(active.token);
    const teacherId = decoded?.UserID || decoded?.userId || null;
    if (!teacherId) {
      setError("Invalid session token.");
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:8000/api/users/viewuser/${teacherId}`, getAuthConfig())
      .then((res) => {
        const user = res.data?.user || res.data || {};
        setFormData({
          FirstName: user.FirstName || "",
          MiddleName: user.MiddleName || "",
          LastName: user.LastName || "",
          Email: user.Email || "",
          UserName: user.UserName || "",
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile.");
        setLoading(false);
      });
  }, [navigate]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Restrict numbers for name fields
    if (["FirstName", "MiddleName", "LastName"].includes(name)) {
      value = value.replace(/[0-9]/g, "");
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const active = getActiveSession();
      const decoded = decodeJwtPayload(active.token);
      const teacherId = decoded?.UserID || decoded?.userId || null;
      if (!teacherId) throw new Error("Invalid token");

      await axios.put(
        `http://localhost:8000/api/users/updateuser/${teacherId}`,
        formData,
        getAuthConfig()
      );

      navigate("/teacher/profile");
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="text-center mt-10 text-slate-500">Loading profile...</div>;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-semibold mb-6 text-center">Edit My Profile</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-slate-700">First Name</label>
            <input
              type="text"
              name="FirstName"
              value={formData.FirstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700">Middle Name</label>
            <input
              type="text"
              name="MiddleName"
              value={formData.MiddleName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700">Last Name</label>
            <input
              type="text"
              name="LastName"
              value={formData.LastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700">Username</label>
            <input
              type="text"
              name="UserName"
              value={formData.UserName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition duration-200"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TeacherEditProfile;
