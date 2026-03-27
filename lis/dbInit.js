const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    // For Railway with MYSQL_URL
    if (process.env.MYSQL_URL) {
        // Parse the URL to extract database name for separate connection
        const url = new URL(process.env.MYSQL_URL);
        return {
            uri: process.env.MYSQL_URL,
            database: url.pathname.replace('/', '') || 'railway' // Extract DB name from URL
        };
    }
    return {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'quizapp_db',
        port: process.env.MYSQLPORT || 3306
    };
};

const initDatabase = async () => {
    const dbConfig = getDbConfig();
    
    let connection;
    let dbName;
    
    // Create connection based on config type
    if (dbConfig.uri) {
        // Railway: Use URI directly - Railway database is already created and included in URL
        connection = mysql.createConnection({ uri: dbConfig.uri, multipleStatements: true });
        dbName = dbConfig.database;
        console.log('Connecting to Railway MySQL database:', dbName);
    } else {
        // Local: Connect without database first to create it if needed
        const tempConfig = { ...dbConfig, multipleStatements: true };
        delete tempConfig.database;
        connection = mysql.createConnection(tempConfig);
        dbName = dbConfig.database;
        
        // Create database if not exists (only for local)
        try {
            await connection.promise().query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            console.log(`Database '${dbName}' ensured.`);
        } catch (err) {
            console.error('Error creating database:', err.message);
        }
        
        // Switch to the database
        await connection.promise().query(`USE \`${dbName}\``);
    }
    
    try {
        // Check if tables exist in this database
        const [rows] = await connection.promise().query(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?`,
            [dbName]
        );
        
        if (rows[0].count === 0) {
            console.log('Database is empty, initializing tables...');
            
            // Read and execute the SQL script
            const sqlPath = path.join(__dirname, 'init.sql');
            if (fs.existsSync(sqlPath)) {
                let sql = fs.readFileSync(sqlPath, 'utf8');
                
                // Clean up the SQL - remove comments and handle multiple statements
                sql = sql.replace(/--.*$/gm, ''); // Remove line comments
                
                const statements = sql.split(';').filter(s => s.trim());
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        await connection.promise().query(statement);
                    }
                }
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
