const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Support Railway's MySQL connection format
const getDbConfig = () => {
    // Try various Railway MySQL URL formats
    const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQLDATABASE_URL;
    
    if (mysqlUrl) {
        try {
            // Parse the URL to extract database name
            const url = new URL(mysqlUrl);
            console.log('Parsed MySQL URL - host:', url.hostname, 'port:', url.port, 'database:', url.pathname);
            return {
                uri: mysqlUrl,
                database: url.pathname.replace('/', '') || 'railway'
            };
        } catch (e) {
            console.error('Failed to parse MySQL URL:', e.message);
        }
    }
    
    // Individual environment variables (Railway format or local)
    const config = {
        host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'quizapp_db',
        port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT) || 3306
    };
    
    return config;
};

const initDatabase = async () => {
    const dbConfig = getDbConfig();
    
    // Log configuration for debugging (hide password)
    console.log('Database config:', {
        hasUri: !!dbConfig.uri,
        database: dbConfig.database,
        host: dbConfig.host || 'from URI',
        port: dbConfig.port || 'from URI'
    });
    
    let connection;
    let dbName;
    
    // Create connection based on config type
    if (dbConfig.uri) {
        // Railway: Use URI directly with SSL
        console.log('Creating connection with URI (Railway mode)...');
        connection = mysql.createConnection({ 
            uri: dbConfig.uri, 
            multipleStatements: true,
            ssl: { rejectUnauthorized: false }, // Required for Railway
            connectTimeout: 60000, // 60 second timeout
            acquireTimeout: 60000,
            timeout: 60000
        });
        dbName = dbConfig.database;
        console.log('Connecting to Railway MySQL database:', dbName);
    } else {
        // Local: Connect without database first to create it if needed
        console.log('Creating connection with individual params (Local mode)...');
        const tempConfig = { ...dbConfig, multipleStatements: true, connectTimeout: 60000 };
        delete tempConfig.database;
        connection = mysql.createConnection(tempConfig);
        dbName = dbConfig.database;
    }
    
    try {
        // Test connection first
        console.log('Testing database connection...');
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
                console.log('SQL file found, size:', sql.length, 'bytes');
                
                // Add USE database statement at the beginning to ensure we're in the right schema
                const dbInitSql = `USE \`${actualDbName}\`;\n${sql}`;
                
                try {
                    // Execute the entire SQL script at once (multipleStatements is enabled)
                    console.log('Executing SQL script...');
                    await connection.promise().query(dbInitSql);
                    console.log('SQL script executed successfully');
                    
                    // Verify tables were created
                    const [verifyRows] = await connection.promise().query(
                        `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
                        [actualDbName]
                    );
                    console.log(`Verified ${verifyRows.length} tables created:`);
                    verifyRows.forEach(t => console.log('  -', t.TABLE_NAME));
                    
                    if (verifyRows.length === 0) {
                        throw new Error('Tables were not created successfully');
                    }
                    
                    console.log('Database initialized successfully!');
                } catch (sqlErr) {
                    console.error('SQL execution error:', sqlErr.message);
                    console.error('SQL Error Code:', sqlErr.code);
                    console.error('SQL State:', sqlErr.sqlState);
                    throw sqlErr;
                }
            } else {
                console.error('No SQL script found at:', sqlPath);
                throw new Error('init.sql file not found');
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
        
        // Return success status
        return true;
    } catch (err) {
        console.error('Database initialization error:', err.message);
        console.error('Error code:', err.code);
        console.error('Error errno:', err.errno);
        throw err; // Re-throw to signal failure
    } finally {
        // Safely close connection
        try {
            if (connection && connection.end) {
                connection.end();
            }
        } catch (closeErr) {
            console.log('Connection already closed or error closing:', closeErr.message);
        }
    }
};

module.exports = { initDatabase };
