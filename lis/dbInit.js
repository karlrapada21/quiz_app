const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    // For Railway with MYSQL_URL
    if (process.env.MYSQL_URL) {
        // Parse the URL to extract database name
        const url = new URL(process.env.MYSQL_URL);
        return {
            uri: process.env.MYSQL_URL,
            database: url.pathname.replace('/', '') || 'railway'
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
        // Railway: Use URI directly
        connection = mysql.createConnection({ uri: dbConfig.uri, multipleStatements: true });
        dbName = dbConfig.database;
        console.log('Connecting to Railway MySQL database:', dbName);
    } else {
        // Local: Connect without database first to create it if needed
        const tempConfig = { ...dbConfig, multipleStatements: true };
        delete tempConfig.database;
        connection = mysql.createConnection(tempConfig);
        dbName = dbConfig.database;
    }
    
    try {
        // Get the actual database name from the connection
        const [dbRows] = await connection.promise().query('SELECT DATABASE() as current_db');
        const actualDbName = dbRows[0].current_db;
        console.log('Actual database name:', actualDbName);
        
        // Check if tables exist - query using actual database name
        const [rows] = await connection.promise().query(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
            [actualDbName]
        );
        
        console.log(`Found ${rows[0].count} tables in database '${actualDbName}'`);
        
        if (rows[0].count === 0) {
            console.log('Database is empty, initializing tables...');
            
            // Read and execute the SQL script
            const sqlPath = path.join(__dirname, 'init.sql');
            console.log('Looking for SQL file at:', sqlPath);
            
            if (fs.existsSync(sqlPath)) {
                let sql = fs.readFileSync(sqlPath, 'utf8');
                console.log('SQL file found, executing...');
                
                try {
                    // Execute the entire SQL script at once (multipleStatements is enabled)
                    await connection.promise().query(sql);
                    console.log('Database initialized successfully!');
                } catch (sqlErr) {
                    console.error('SQL execution error:', sqlErr.message);
                    throw sqlErr;
                }
            } else {
                console.error('No SQL script found at:', sqlPath);
            }
        } else {
            console.log(`Database already has ${rows[0].count} tables, skipping initialization`);
            // List existing tables for debugging
            const [tables] = await connection.promise().query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
                [actualDbName]
            );
            tables.forEach(t => console.log('  -', t.TABLE_NAME));
        }
    } catch (err) {
        console.error('Database initialization error:', err.message);
        console.error('Stack:', err.stack);
    } finally {
        connection.end();
    }
};

module.exports = { initDatabase };
