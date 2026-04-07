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
            ssl: { rejectUnauthorized: false }, // Required for Railway
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
    }
    // Otherwise use individual Railway environment variables or local variables
    const config = {
        host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
        user: process.env.MYSQLUSER || process.env.DB_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || "quizapp_db",
        port: process.env.MYSQLPORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
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

// Use connection pool instead of single connection for better reliability
// Pool automatically handles reconnection when connections are lost
const pool = mysql.createPool(dbConfig);

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Successfully connected to MySQL database:", dbConfig.database);
        // Verify actual database
        connection.query('SELECT DATABASE() as current_db', (err, results) => {
            if (err) {
                console.error('Error checking current database:', err);
            } else {
                console.log('Current database:', results[0].current_db);
            }
            connection.release(); // Release back to pool
        });
    }
});

// Export pool with query method that matches the callback-style interface
// used throughout the codebase (userController.js, quizAnswersRoutes.js)
const db = {
    query: (sql, params, callback) => {
        // Handle both (sql, callback) and (sql, params, callback) signatures
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params, callback);
    }
};

module.exports = db;
