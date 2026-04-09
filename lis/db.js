const mysql = require("mysql2");
require("dotenv").config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    // Try various Railway MySQL URL formats
    const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQLDATABASE_URL;
    
    if (mysqlUrl) {
        console.log("Using MySQL URL for connection");
        try {
            const url = new URL(mysqlUrl);
            return {
                host: url.hostname,
                user: url.username,
                password: url.password,
                database: url.pathname.replace('/', '') || 'railway',
                port: parseInt(url.port) || 3306,
                ssl: { rejectUnauthorized: false }, // Required for Railway
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                connectTimeout: 60000,
                acquireTimeout: 60000
            };
        } catch (e) {
            console.error('Failed to parse MySQL URL:', e.message);
        }
    }
    
    // Individual environment variables (Railway format or local)
    const config = {
        host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
        database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || "quizapp_db",
        port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 60000,
        acquireTimeout: 60000
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
