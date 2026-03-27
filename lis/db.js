const mysql = require("mysql2");
require("dotenv").config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    // If Railway provides MYSQL_URL, parse it properly
    if (process.env.MYSQL_URL) {
        console.log("Using Railway MYSQL_URL for connection");
        const url = new URL(process.env.MYSQL_URL);
        return {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.replace('/', '') || 'railway',
            port: parseInt(url.port) || 3306,
            ssl: { rejectUnauthorized: false } // Required for Railway
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

const dbConfig = getDbConfig();
console.log('DB Config (hiding password):', { 
    host: dbConfig.host, 
    user: dbConfig.user, 
    database: dbConfig.database, 
    port: dbConfig.port 
});

const db = mysql.createConnection(dbConfig);

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Successfully connected to MySQL database:", dbConfig.database);
        // Verify actual database
        db.query('SELECT DATABASE() as current_db', (err, results) => {
            if (err) {
                console.error('Error checking current database:', err);
            } else {
                console.log('Current database:', results[0].current_db);
            }
        });
    }
});

module.exports = db;