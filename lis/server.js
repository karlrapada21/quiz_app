const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { initDatabase } = require("./dbInit");

const app = express();

// Health check endpoint for Railway
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(cors());

// Determine where to serve static files from
const viteDistPath = path.join(__dirname, "../vite/dist");
const publicPath = path.join(__dirname, "public");

// Use public folder if it exists, otherwise use vite/dist
let staticPath = viteDistPath;
if (fs.existsSync(publicPath)) {
  staticPath = publicPath;
} else if (!fs.existsSync(viteDistPath) && process.env.NODE_ENV === "production") {
  console.warn("Static folder not found. Frontend should be built first.");
}

// Serve static files from the appropriate folder
app.use(express.static(staticPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mount routers
try {
  const quizAnswersRoutes = require("./quizAnswersRoutes");
  app.use("/api/quiz_answers", quizAnswersRoutes);
} catch (e) {
  console.error("Could not mount quizAnswersRoutes:", e.message);
}
try {
  const quizScoresRoutes = require("./quizScoresRoutes");
  app.use("/api/quiz_scores", quizScoresRoutes);
} catch (e) {
  console.error("Could not mount quizScoresRoutes:", e.message);
}
try {
  const quizzesRoutes = require("./quizzesRoutes");
  app.use("/api/quizzes", quizzesRoutes);
} catch (e) {
  console.error("Could not mount quizzesRoutes:", e.message);
}
try {
  const userRoutes = require("./userRoutes");
  app.use("/api/users", userRoutes);
} catch (e) { /* optional */ }

app.get("/", (_req, res) => res.send("API running"));

// Serve index.html for any unknown routes (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // Required for Railway - must bind to all interfaces

// Log all available MySQL-related environment variables for debugging
console.log('=== Environment Variables Debug ===');
console.log('MYSQL_URL exists:', !!process.env.MYSQL_URL);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('MYSQLDATABASE_URL exists:', !!process.env.MYSQLDATABASE_URL);
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLPORT:', process.env.MYSQLPORT);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('PORT:', process.env.PORT);
console.log('================================');

// Start server immediately so health check endpoint is available
// Bind to 0.0.0.0 which is required for Railway/Cloud deployments
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Health check available at /health`);
});

// Initialize database after server starts (non-blocking for health checks)
// Add a small delay to ensure server is fully ready
setTimeout(() => {
  console.log('Starting database initialization...');
  initDatabase()
    .then(() => {
      console.log('Database initialization completed');
    })
    .catch((err) => {
      console.error('Database initialization failed:', err.message);
      console.error('The server will continue running but API routes may not work.');
      // Don't exit - server stays running for health checks
    });
}, 1000); // 1 second delay to ensure server is ready first
