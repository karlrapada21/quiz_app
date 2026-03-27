import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthConfig, getActiveSession } from "../utils/sessions";

function TeacherUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // pagination state - show 5 users per page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    const active = getActiveSession();
    if (!active || !active.token || active.role !== "teacher") {
      navigate("/login");
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users/viewusers", getAuthConfig());
      const data = res.data || {};
      const list = data.results || data.users || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch users", err?.response?.data || err?.message);
      setUsers([]);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user and all their quiz data?")) return;
    setDeletingId(userId);
    try {
      await axios.delete(`/api/users/deleteuser/${userId}`, getAuthConfig());
      await fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err?.response?.data || err?.message || err);
      alert("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.FirstName || ""} ${user.MiddleName ? (user.MiddleName + " ") : ""}${user.LastName || ""}`.trim();
    const q = search.toLowerCase();
    return (
      fullName.toLowerCase().includes(q) ||
      (user.Email || "").toLowerCase().includes(q) ||
      (user.UserName || "").toLowerCase().includes(q)
    );
  });

  // reset to page 1 when search or user list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  // clamp currentPage if out of range after list changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleViewQuizzes = (userId) => {
    navigate(`/teacher/user/${userId}/quizzes`);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPageButtons = () => {
    // If many pages, you can implement a windowed pager. For now show all.
    return Array.from({ length: totalPages }).map((_, i) => {
      const page = i + 1;
      return (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-1 rounded ${page === currentPage ? "bg-emerald-600 text-white" : "bg-white border"}`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 w-full max-w-4xl border border-slate-300">
        <h2 className="text-3xl font-semibold text-emerald-700 text-center mb-6">All Users</h2>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or username..."
          className="w-full mb-6 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        />

        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-emerald-50">
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">#</th>
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">Name</th>
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">Email</th>
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">Username</th>
                <th className="py-3 px-5 border-b text-left text-slate-700 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((user) => (
                  <tr key={user.UserID ?? user.id ?? Math.random()} className="hover:bg-emerald-50 transition-colors">
                    <td className="py-3 px-5 border-b">{user.UserID ?? user.id ?? "-"}</td>
                    <td className="py-3 px-5 border-b">
                      {user.FirstName} {user.MiddleName ? `${user.MiddleName} ` : ""}{user.LastName}
                    </td>
                    <td className="py-3 px-5 border-b">{user.Email}</td>
                    <td className="py-3 px-5 border-b">{user.UserName}</td>
                    <td className="py-3 px-5 border-b flex gap-2">
                      <button
                        onClick={() => handleViewQuizzes(user.UserID ?? user.id)}
                        className="bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white font-semibold py-1 px-4 rounded transition-all shadow-sm"
                      >
                        View Scores
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.UserID ?? user.id)}
                        disabled={deletingId === (user.UserID ?? user.id)}
                        className={`${
                          deletingId === (user.UserID ?? user.id)
                            ? "bg-rose-400"
                            : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700"
                        } text-white font-semibold py-1 px-4 rounded transition-all shadow-sm`}
                      >
                        {deletingId === (user.UserID ?? user.id) ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/edit/${user.UserID ?? user.id}`)}
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-semibold py-1 px-4 rounded transition-all shadow-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {pagedUsers.length === 0 ? 0 : startIndex + 1} - {startIndex + pagedUsers.length} of {filteredUsers.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? "bg-slate-200 text-slate-500" : "bg-emerald-600 text-white"}`}
            >
              Prev
            </button>

            <div className="flex gap-2">{renderPageButtons()}</div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${currentPage === totalPages ? "bg-slate-200 text-slate-500" : "bg-emerald-600 text-white"}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherUsers;