const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || req.header("Authorization");
  if (!authHeader) return res.status(401).json({ message: "Missing auth token" });

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // normalize req.user to include UserID and role
    req.user = { UserID: payload.UserID, role: payload.role || "student" };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports.requireTeacher = (req, res, next) => {
  // authMiddleware must run before this so req.user exists
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== 'teacher') return res.status(403).json({ message: "Forbidden: teacher only" });
  next();
};