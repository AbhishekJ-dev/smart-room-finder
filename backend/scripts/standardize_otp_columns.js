const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    console.log('🚀 Starting OTP column migration...');

    try {
        // Add or Rename columns for standard OTP system
        const [rows] = await connection.execute('SHOW COLUMNS FROM users');
        const columns = rows.map(r => r.Field);

        // Ensure otp exists
        if (!columns.includes('otp')) {
            console.log('➕ Adding "otp" column...');
            await connection.execute('ALTER TABLE users ADD COLUMN otp VARCHAR(6) AFTER is_verified');
        } else {
            console.log('✅ "otp" column already exists.');
        }

        // Ensure otp_expiry exists
        if (!columns.includes('otp_expiry')) {
            console.log('➕ Adding "otp_expiry" column...');
            await connection.execute('ALTER TABLE users ADD COLUMN otp_expiry DATETIME AFTER otp');
        } else {
            console.log('✅ "otp_expiry" column already exists.');
        }

        // Ensure is_verified exists (logic is already in users table usually but let's be sure)
        if (!columns.includes('is_verified')) {
            console.log('➕ Adding "is_verified" column...');
            await connection.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER password');
        } else {
            console.log('✅ "is_verified" column already exists.');
        }

        console.log('✨ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
