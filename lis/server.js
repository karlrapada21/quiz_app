const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));