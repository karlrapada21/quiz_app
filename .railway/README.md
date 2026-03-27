# Railway Deployment Guide for Quiz App

## Overview
This is a React + Express + MySQL quiz application ready for Railway deployment.

## Project Structure
- `lis/` - Backend (Express + MySQL2)
- `vite/` - Frontend (React + Vite)

## Deployment Steps

### 1. Create a Railway Account
1. Go to [Railway](https://railway.app) and sign up/login
2. Install Railway CLI (optional): `npm i -g @railway/cli`

### 2. Create MySQL Database in Railway
1. In Railway dashboard, click **"New"** > **"Database"** > **"Add MySQL"**
2. Once created, Railway will provide MySQL connection variables automatically

### 3. Deploy the Backend

#### Option A: Via Railway Dashboard
1. Create a new project: **"New"** > **"Project"**
2. Click **"Add a Service"** > **"Empty Service"**
3. Name it `quiz-backend`
4. Connect your GitHub repo (or drag & drop the `lis` folder)
5. In **Settings** > **Variables**, add the following environment variables:

**Required Environment Variables:**
```
PORT=8000
DB_HOST=${MYSQLHOST}  (Railway provides this)
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
MYSQLPORT=${MYSQLPORT}
JWT_SECRET=your-secret-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

6. Click **Deploy**

### 4. Build and Deploy Frontend

#### Option A: Same Service (Monorepo approach)
1. At the root level, install dependencies and build frontend:
```bash
# Build frontend
cd vite
npm install
npm run build
mv dist ../lis/public
cd ../lis
npm install
npm start
```

#### Option B: Deploy Frontend Separately (Recommended for Railway)
1. Create another service in Railway for the frontend
2. Set build command: `npm run build`
3. Set output directory: `dist`

### 5. Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the server (Railway sets this automatically) |
| `MYSQLHOST` | MySQL hostname (Railway provides) |
| `MYSQLUSER` | MySQL username (Railway provides) |
| `MYSQLPASSWORD` | MySQL password (Railway provides) |
| `MYSQLDATABASE` | MySQL database name (Railway provides) |
| `MYSQLPORT` | MySQL port (Railway provides) |
| `JWT_SECRET` | Secret key for JWT token generation |
| `EMAIL_USER` | Gmail account for password reset |
| `EMAIL_PASS` | Gmail app password |

### 6. Database Setup

After deploying, run the database migration:

1. Go to your MySQL database in Railway
2. Click **"Connect"** > **"Query Editor"**
3. Copy contents from `db script.txt` or use `dump-quizapp_db-202603271307.sql`
4. Execute the SQL scripts to create tables and seed data

### 7. Important Notes

- **CORS**: Backend is configured with CORS enabled for cross-origin requests
- **Static Files**: Backend serves frontend static files from `../vite/dist`
- **SPA Routes**: Backend handles client-side routing by serving `index.html` for unknown routes

### 8. Troubleshooting

**Database Connection Issues:**
- Verify Railway MySQL is running
- Check environment variables match Railway's provided values
- Ensure `MYSQL_URL` or individual MySQL variables are set

**Frontend Not Loading:**
- Run `npm run build` in `vite` folder first
- Verify `dist` folder exists and contains built files

**CORS Errors:**
- Ensure backend CORS is properly configured with your frontend URL

## Database Schema Summary

Tables:
- `Users` - Student and teacher accounts
- `QuizScores` - Quiz score records
- `QuizUserAnswers` - Detailed quiz answers
- `Quizzes` - Quiz questions and answers
- `PasswordResetTokens` - Password reset functionality

## Local Development

```bash
# Backend
cd lis
npm install
cp .env.example .env  # Create env file
npm run dev

# Frontend (new terminal)
cd vite
npm install
npm run dev
```

## Tech Stack
- Backend: Node.js, Express, MySQL2
- Frontend: React 19, Vite, TailwindCSS, Axios
- Auth: JWT (jsonwebtoken)
- Email: Nodemailer
