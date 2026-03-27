const mysql = require("mysql2");
require("dotenv").config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    // If Railway provides MYSQL_URL, use it (Railway automatically includes DB in URL)
    if (process.env.MYSQL_URL) {
        console.log("Using Railway MYSQL_URL for connection");
        return {
            uri: process.env.MYSQL_URL
        };
    }
    // Otherwise use individual Railway environment variables or local variables
    const config = {
        host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
        user: process.env.MYSQLUSER || process.env.DB_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || "quizapp_db",
        port: process.env.MYSQLPORT || 3306
    };
    console.log(`Using database connection to: ${config.database}`);
    return config;
};

const db = mysql.createConnection(getDbConfig());

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        if (process.env.MYSQL_URL) {
            console.log("Successfully connected to Railway MySQL database");
        } else {
            console.log("Successfully connected to local MySQL database");
        }
    }
});

module.exports = db;
