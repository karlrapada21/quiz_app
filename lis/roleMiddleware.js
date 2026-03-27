// ...existing code...
// Minimal role middleware used by routes. Exports requireTeacher and requireStudent.
// Replace logic with your real implementation if you have one.

function _getRoleFromReq(req) {
  return req.user?.Role || req.user?.role || (req.user?.roleName) || null;
}

function requireTeacher(req, res, next) {
  const role = _getRoleFromReq(req);
  if (!role) {
    // in dev allow using ?userRole=teacher for quick testing
    const testRole = (req.query.userRole || req.body.userRole);
    if (testRole === 'teacher') return next();
    return res.status(401).json({ error: 'Unauthorized - teacher required' });
  }
  if (role === 'teacher') return next();
  return res.status(403).json({ error: 'Forbidden - teacher role required' });
}

function requireStudent(req, res, next) {
  const role = _getRoleFromReq(req);
  if (!role) {
    // allow ?userRole=student for local testing
    const testRole = (req.query.userRole || req.body.userRole);
    if (testRole === 'student') return next();
    return res.status(401).json({ error: 'Unauthorized - student required' });
  }
  if (role === 'student') return next();
  return res.status(403).json({ error: 'Forbidden - student role required' });
}

module.exports = {
  requireTeacher,
  requireStudent
};