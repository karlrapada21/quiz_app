const mysql = require("mysql2");
require("dotenv").config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    // If Railway provides MYSQL_URL, use it
    if (process.env.MYSQL_URL) {
        return {
            uri: process.env.MYSQL_URL
        };
    }
    // Otherwise use individual Railway environment variables or local variables
    return {
        host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
        user: process.env.MYSQLUSER || process.env.DB_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || "quizapp_db",
        port: process.env.MYSQLPORT || 3306
    };
};

const db = mysql.createConnection(getDbConfig());

db.connect(err => {
    if (err){
        console.error("Database connection failed", err);
    }else{
        console.log("Successfully connected to MySQL database");
    }
});

module.exports = db;