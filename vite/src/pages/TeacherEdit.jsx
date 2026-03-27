import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getActiveSession, getAuthConfig } from "../utils/sessions";

function TeacherEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    FirstName: "",
    MiddleName: "",
    LastName: "",
    Email: "",
    UserName: "",
    Role: "student",
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

    const loadUser = async () => {
      try {
        const res = await axios.get(`/api/users/viewuser/${userId}`, getAuthConfig());
        const user = res.data?.user || res.data || {};
        setForm({
          FirstName: user.FirstName || "",
          MiddleName: user.MiddleName || "",
          LastName: user.LastName || "",
          Email: user.Email || "",
          UserName: user.UserName || "",
          Role: user.Role || "student",
        });
      } catch (err) {
        console.error("Failed to load user", err?.response?.data || err?.message);
        setError("Failed to load user.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, navigate]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Restrict numbers for name fields
    if (["FirstName", "MiddleName", "LastName"].includes(name)) {
      value = value.replace(/[0-9]/g, "");
    }

    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.put(
        `/api/users/updateuser/${userId}`,
        form,
        getAuthConfig()
      );
      navigate("/teacher/teacherusers");
    } catch (err) {
      console.error("Update failed", err?.response?.data || err?.message);
      setError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading user...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-semibold mb-6 text-center">Edit User</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input
              name="FirstName"
              value={form.FirstName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
            <input
              name="MiddleName"
              value={form.MiddleName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input
              name="LastName"
              value={form.LastName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              name="Email"
              type="email"
              value={form.Email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              name="UserName"
              value={form.UserName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/teacher/teacherusers")}
              className="flex-1 px-4 py-2 rounded bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded bg-blue-600 text-white"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeacherEdit;
