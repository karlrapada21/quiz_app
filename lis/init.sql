-- Initialize quizapp_db database and tables
-- Run this in Railway Query Editor or via init script

-- Use the database
USE quizapp_db;

-- Drop tables in reverse order to avoid FK constraint errors
DROP TABLE IF EXISTS QuizUserAnswers;
DROP TABLE IF EXISTS QuizScores;
DROP TABLE IF EXISTS PasswordResetTokens;
DROP TABLE IF EXISTS Quizzes;
DROP TABLE IF EXISTS Users;

-- Create Users table
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(50),
    MiddleName VARCHAR(50),
    LastName VARCHAR(50),
    Email VARCHAR(100) UNIQUE NOT NULL,
    UserName VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('student','teacher') NOT NULL DEFAULT 'student'
);

-- Create QuizScores table
CREATE TABLE QuizScores (
    ScoreID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    QuizName VARCHAR(100) NOT NULL,
    Score INT NOT NULL,
    Total INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create PasswordResetTokens table
CREATE TABLE PasswordResetTokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    userType ENUM('user','teacher') NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiresAt DATETIME NOT NULL
);

-- Create QuizUserAnswers table
CREATE TABLE QuizUserAnswers (
    AnswerID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    QuizName VARCHAR(100) NOT NULL,
    Answers JSON NOT NULL,
    SubmittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create Quizzes table
CREATE TABLE Quizzes (
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

-- Insert default teacher account
INSERT INTO Users (Email, UserName, Password, FirstName, MiddleName, LastName, Role)
VALUES ('hanzdavid2002@gmail.com', 'Teacher1', '$2b$10$MrTpTaHhg5dqqZ5UN4Qd9OGmuU8YGlLp/YH8b8OArbusvAg1GegOC', 'Hanz', 'David', 'Lim', 'teacher');
