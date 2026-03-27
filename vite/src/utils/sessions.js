// ...existing code...
const SESSIONS_KEY = "qa_sessions";
const ACTIVE_KEY = "qa_active_session_id"; // key name used in both storages

/* legacy single-token keys (optional) */
const LEGACY_TOKEN_KEY = "token";
const LEGACY_ROLE_KEY = "role";
const LEGACY_USERNAME_KEY = "username";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadSessions() {
  const raw = localStorage.getItem(SESSIONS_KEY);
  return safeParse(raw) || [];
}

export function saveSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions || []));
  } catch (error) {
    console.warn('saveSessions failed', error);
  }
}

export function listSessions() {
  return loadSessions();
}

export function getSessionById(id) {
  if (!id) return null;
  return loadSessions().find(s => s.id === id) || null;
}

/**
 * Read active session id — prefer sessionStorage (per-tab) then localStorage (global).
 */
function readActiveSessionId() {
  try {
    const sessionId = sessionStorage.getItem(ACTIVE_KEY);
    if (sessionId) return sessionId;
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function getActiveSession() {
  const id = readActiveSessionId();
  if (!id) return null;
  return getSessionById(id);
}

/**
 * Set active session id.
 * Options:
 *  - persist: boolean (false by default). When false store in sessionStorage (per-tab).
 *             When true store in localStorage (shared across tabs).
 */
export function setActiveSession(id, { persist = false } = {}) {
  if (!id) return;
  const s = getSessionById(id);
  if (!s) return;
  try {
    if (persist) {
      localStorage.setItem(ACTIVE_KEY, id);
      // remove any per-tab override
      try { sessionStorage.removeItem(ACTIVE_KEY); } catch (error) { console.warn('removeItem failed', error); }
    } else {
      sessionStorage.setItem(ACTIVE_KEY, id);
    }
  } catch (error) {
    console.warn('setActiveSession failed', error);
  }
}

export function clearActiveSession() {
  try {
    sessionStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  } catch (error) {
    console.warn('clearActiveSession failed', error);
  }
}

function clearLegacyGlobals() {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
    localStorage.removeItem(LEGACY_USERNAME_KEY);
  } catch (error) {
    console.warn('clearLegacyGlobals failed', error);
  }
}

/**
 * Add a session.
 * opts: { userName, token, role, meta }
 * options param: { setActive=true, persist=false }
 *  - setActive: whether to make this session the active for THIS TAB
 *  - persist: when true active is set globally (localStorage); otherwise per-tab
 */
export function addSession({ userName, token, role, userId, meta } = {}, { setActive = true, persist = false } = {}) {
  if (!token) throw new Error("token required");
  const sessions = loadSessions();
  const id = `${userName || "user"}_${Date.now()}`;
  const session = {
    id,
    userName: userName || null,
    token,
    role: role || null,
    userId: userId || (meta?.userId || null),
    meta: meta || {},
    createdAt: new Date().toISOString()
  };
  sessions.push(session);
  saveSessions(sessions);

  // remove legacy globals so older code doesn't read a single overwritten token
  clearLegacyGlobals();

  if (setActive) {
    setActiveSession(id, { persist });
  }
  return session;
}

export function removeSession(id) {
  if (!id) return;
  const sessions = loadSessions().filter(s => s.id !== id);
  saveSessions(sessions);
  // if active in sessionStorage equals removed id, clear it or fallback to last
  try {
    const perTabActive = sessionStorage.getItem(ACTIVE_KEY);
    const globalActive = localStorage.getItem(ACTIVE_KEY);
    if (perTabActive === id) {
      sessionStorage.removeItem(ACTIVE_KEY);
      if (sessions.length > 0) sessionStorage.setItem(ACTIVE_KEY, sessions[sessions.length - 1].id);
    }
    if (globalActive === id) {
      if (sessions.length > 0) localStorage.setItem(ACTIVE_KEY, sessions[sessions.length - 1].id);
      else localStorage.removeItem(ACTIVE_KEY);
    }
  } catch (error) {
    console.warn('removeSession failed', error);
  }
}

export function getAuthConfig(sessionId) {
  const session = sessionId ? getSessionById(sessionId) : getActiveSession();
  if (session && session.token) {
    return { headers: { Authorization: `Bearer ${session.token}` } };
  }
  return {};
}

export function getAuthHeader(sessionId) {
  const cfg = getAuthConfig(sessionId);
  return cfg.headers || {};
}
// ...existing code...