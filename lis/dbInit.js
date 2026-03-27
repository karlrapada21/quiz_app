const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    if (process.env.MYSQL_URL) {
        return { uri: process.env.MYSQL_URL };
    }
    return {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'quizapp_db',
        port: process.env.MYSQLPORT || 3306,
        multipleStatements: true
    };
};

const initDatabase = async () => {
    const dbConfig = getDbConfig();
    
    // Connect without database first (to create if needed)
    const tempConfig = { ...dbConfig };
    if (!process.env.MYSQL_URL) {
        delete tempConfig.database;
    }
    
    const connection = mysql.createConnection(tempConfig);
    
    try {
        // Check if database exists and has tables
        const [rows] = await connection.promise().query(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()`
        );
        
        if (rows[0].count === 0) {
            console.log('Database is empty, initializing tables...');
            
            // Read and execute the SQL script
            const sqlPath = path.join(__dirname, '..', 'db script.txt');
            if (fs.existsSync(sqlPath)) {
                let sql = fs.readFileSync(sqlPath, 'utf8');
                
                // Clean up the SQL - remove comments and problematic statements
                sql = sql.replace(/--.*$/gm, ''); // Remove line comments
                
                await connection.promise().query(sql);
                console.log('Database initialized successfully!');
            } else {
                console.log('No SQL script found, skipping initialization');
            }
        } else {
            console.log(`Database already has ${rows[0].count} tables`);
        }
    } catch (err) {
        console.error('Database initialization error:', err.message);
    } finally {
        connection.end();
    }
};

module.exports = { initDatabase };
