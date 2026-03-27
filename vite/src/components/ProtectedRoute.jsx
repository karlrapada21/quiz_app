import React from "react";
import { Navigate } from "react-router-dom";
import { getSessionById } from "../utils/sessions";

const ACTIVE_KEY = "qa_active_session_id";

function ProtectedRoute({ children, teacherOnly }) {
  // Use per-tab active id (sessionStorage) only to decide auth.
  const activeId = (() => {
    try { return sessionStorage.getItem(ACTIVE_KEY); } catch { return null; }
  })();

  const active = activeId ? getSessionById(activeId) : null;
  const token = active?.token || null;
  const role = active?.role || null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (teacherOnly && role !== "teacher") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;