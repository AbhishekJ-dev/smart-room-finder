require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');

async function sync() {
    console.log('Connecting to cloud database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('--- Initializing Full Schema ---');

        // 1. Users
        console.log('Creating users table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'owner', 'admin') NOT NULL DEFAULT 'user',
                is_verified BOOLEAN DEFAULT FALSE,
                otp_code VARCHAR(10),
                reset_otp VARCHAR(10),
                otp_expiry DATETIME,
                temp_email VARCHAR(255),
                google_id VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Rooms
        console.log('Creating rooms table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                type ENUM('1BHK', '2BHK', 'PG', 'Room') NOT NULL,
                price_daily DECIMAL(10,2) DEFAULT 0.00,
                price_monthly DECIMAL(10,2) DEFAULT 0.00,
                location VARCHAR(255) NOT NULL,
                description TEXT,
                is_booked TINYINT(1) DEFAULT 0,
                is_deleted TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. Bookings
        console.log('Creating bookings table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                room_id INT NOT NULL,
                status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
                rating FLOAT DEFAULT 0,
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
            )
        `);

        // 4. Notifications
        console.log('Creating notifications table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('--- Database schema is now 100% complete! ---');
    } catch (error) {
        console.error('Error syncing database:', error);
    } finally {
        await connection.end();
    }
}

sync();
