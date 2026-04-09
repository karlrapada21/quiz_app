const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Health check endpoint for Railway - MUST be first and always available
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Import dbInit after express is set up - this allows server to start even if db has issues
let initDatabase;
try {
  initDatabase = require("./dbInit").initDatabase;
} catch (e) {
  console.error('Failed to load dbInit module:', e.message);
  initDatabase = async () => console.log('Database init skipped - module load failed');
}

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

// Basic routes that don't need database
app.get("/", (_req, res) => res.send("API running"));

// Placeholder for API routes - will be mounted after server starts
let routesLoaded = false;

app.use("/api/*", (req, res, next) => {
  if (!routesLoaded) {
    return res.status(503).json({ error: 'Server is initializing, please retry in a moment' });
  }
  next();
});

// Serve index.html for any unknown routes (SPA routing)
app.get("*", (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(staticPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send('Error loading page');
    }
  });
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

// Function to load routes after server starts
const loadRoutes = () => {
  try {
    const quizAnswersRoutes = require("./quizAnswersRoutes");
    app.use("/api/quiz_answers", quizAnswersRoutes);
    console.log('Loaded quizAnswersRoutes');
  } catch (e) {
    console.error("Could not mount quizAnswersRoutes:", e.message);
  }
  try {
    const quizScoresRoutes = require("./quizScoresRoutes");
    app.use("/api/quiz_scores", quizScoresRoutes);
    console.log('Loaded quizScoresRoutes');
  } catch (e) {
    console.error("Could not mount quizScoresRoutes:", e.message);
  }
  try {
    const quizzesRoutes = require("./quizzesRoutes");
    app.use("/api/quizzes", quizzesRoutes);
    console.log('Loaded quizzesRoutes');
  } catch (e) {
    console.error("Could not mount quizzesRoutes:", e.message);
  }
  try {
    const userRoutes = require("./userRoutes");
    app.use("/api/users", userRoutes);
    console.log('Loaded userRoutes');
  } catch (e) {
    console.error("Could not mount userRoutes:", e.message);
  }
  
  routesLoaded = true;
  console.log('All routes loaded');
};

// Initialize database and load routes after server starts
// Add a small delay to ensure server is fully ready
setTimeout(() => {
  console.log('Starting database initialization...');
  initDatabase()
    .then(() => {
      console.log('Database initialization completed');
      loadRoutes();
    })
    .catch((err) => {
      console.error('Database initialization failed:', err.message);
      console.error('The server will continue running but API routes may not work.');
      // Try to load routes anyway
      loadRoutes();
    });
}, 1000); // 1 second delay to ensure server is ready first
