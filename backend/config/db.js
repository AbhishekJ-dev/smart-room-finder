const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Production-ready MySQL Pool Configuration
 * Optimized for filess.io and cloud environments (Render)
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 2, // Filess.io has a hard limit of 5. Keeping it low prevents crashes.
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Immediate connection test with clean logging
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`✅ Success: Connected to MySQL database [${process.env.DB_NAME}] at ${process.env.DB_HOST}`);
        connection.release();
    } catch (err) {
        console.error('❌ Database Connection Failed');
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error(`Error: The database name "${process.env.DB_NAME}" does not exist. Please check your .env file.`);
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Error: Access denied. Check your DB_USER and DB_PASSWORD.');
        } else {
            console.error('Reason:', err.message);
        }
    }
})();

module.exports = pool;
