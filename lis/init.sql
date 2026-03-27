-- Initialize quizapp_db database and tables
-- Tables are created in the current database (set by connection)

-- Disable foreign key checks during setup
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse order to avoid FK constraint errors
DROP TABLE IF EXISTS quizuseranswers;
DROP TABLE IF EXISTS quizscores;
DROP TABLE IF EXISTS passwordresettokens;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS users;

-- Create Users table
CREATE TABLE users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(50),
    MiddleName VARCHAR(50),
    LastName VARCHAR(50),
    Email VARCHAR(100) UNIQUE NOT NULL,
    UserName VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('student','teacher') NOT NULL DEFAULT 'student'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Quizzes table
CREATE TABLE quizzes (
    QuizID INT AUTO_INCREMENT PRIMARY KEY,
    QuizName VARCHAR(100) NOT NULL,
    QuestionText TEXT NOT NULL,
    OptionsJSON JSON NULL,
    AnswerJSON JSON NULL,
    QuestionType ENUM('multiple-choice','identification','open-ended','true-false') DEFAULT 'open-ended',
    TotalPoints INT DEFAULT 1,
    QuestionOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create QuizScores table
CREATE TABLE quizscores (
    ScoreID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    QuizName VARCHAR(100) NOT NULL,
    Score INT NOT NULL,
    Total INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create PasswordResetTokens table
CREATE TABLE passwordresettokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    userType ENUM('user','teacher') NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiresAt DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create QuizUserAnswers table
CREATE TABLE quizuseranswers (
    AnswerID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    QuizName VARCHAR(100) NOT NULL,
    Answers JSON NOT NULL,
    SubmittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Insert default teacher account
INSERT INTO users (Email, UserName, Password, FirstName, MiddleName, LastName, Role)
VALUES ('hanzdavid2002@gmail.com', 'Teacher1', '$2b$10$MrTpTaHhg5dqqZ5UN4Qd9OGmuU8YGlLp/YH8b8OArbusvAg1GegOC', 'Hanz', 'David', 'Lim', 'teacher');
