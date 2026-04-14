const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

async function migrateData() {
    console.log('🚀 Starting Data Migration: SQLite -> MySQL');
    
    // Connect to SQLite
    const sqlitePath = path.join(__dirname, 'smart_room_finder.db');
    const sqliteDb = new Database(sqlitePath, { fileMustExist: false });
    console.log('✅ Connected to SQLite source database.');

    // Connect to MySQL
    const mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root123',
        database: process.env.DB_NAME || 'smart_room_finder',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('✅ Connected to MySQL destination database.');

    try {
        // 1. Migrate Users & Roles
        const sqliteUsers = sqliteDb.prepare('SELECT * FROM users').all();
        console.log(`Migrating ${sqliteUsers.length} users...`);
        for (const user of sqliteUsers) {
            // Check if user already exists
            const [existing] = await mysqlPool.execute('SELECT id FROM users WHERE email = ?', [user.email]);
            if (existing.length > 0) continue;
            
            // Insert into Users table
            const [userResult] = await mysqlPool.execute(
                'INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, user.name, user.email, user.password, user.role, user.created_at]
            );

            // Create linked profiles based on role
            if (user.role === 'owner') {
                await mysqlPool.execute('INSERT IGNORE INTO owners (user_id) VALUES (?)', [user.id]);
            } else if (user.role === 'admin') {
                await mysqlPool.execute('INSERT IGNORE INTO admins (user_id) VALUES (?)', [user.id]);
            }
        }
        console.log('✅ Users migrated.');

        // 2. Migrate Rooms & Room Images
        const sqliteRooms = sqliteDb.prepare('SELECT * FROM rooms').all();
        console.log(`Migrating ${sqliteRooms.length} rooms...`);
        for (const room of sqliteRooms) {
            // Check if room exists
            const [existing] = await mysqlPool.execute('SELECT id FROM rooms WHERE id = ?', [room.id]);
            if (existing.length > 0) continue;

            const [roomResult] = await mysqlPool.execute(
                `INSERT INTO rooms (id, owner_id, type, price_daily, price_weekly, price_monthly, price_quarterly, price_yearly, area, location, contact, description, is_booked, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [room.id, room.owner_id, room.type, room.price_daily || 0, room.price_weekly || 0, room.price_monthly || 0, room.price_quarterly || 0, room.price_yearly || 0, room.area, room.location, room.contact, room.description, room.is_booked, room.created_at]
            );

            // Handle photos migration (JSON array in SQLite -> room_images table in MySQL)
            if (room.photos) {
                try {
                    const photosArray = JSON.parse(room.photos);
                    for (let i = 0; i < photosArray.length; i++) {
                        const isPrimary = (i === 0) ? 1 : 0;
                        await mysqlPool.execute(
                            'INSERT INTO room_images (room_id, image_url, is_primary) VALUES (?, ?, ?)',
                            [room.id, photosArray[i], isPrimary]
                        );
                    }
                } catch (e) {
                    console.error(`Error parsing photos for room ${room.id}:`, e.message);
                }
            }
        }
        console.log('✅ Rooms & Images migrated.');

        // 3. Migrate Bookings
        const sqliteBookings = sqliteDb.prepare('SELECT * FROM bookings').all();
        console.log(`Migrating ${sqliteBookings.length} bookings...`);
        for (const booking of sqliteBookings) {
            const [existing] = await mysqlPool.execute('SELECT id FROM bookings WHERE id = ?', [booking.id]);
            if (existing.length > 0) continue;

            // Notice standardisation of status logic
            const status = booking.status.toLowerCase() === 'confirmed' ? 'confirmed' : 'pending';

            await mysqlPool.execute(
                `INSERT INTO bookings (id, user_id, room_id, duration, booking_date, status) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [booking.id, booking.user_id, booking.room_id, booking.duration, booking.booking_date, status]
            );
        }
        console.log('✅ Bookings migrated.');
        
        // 4. Migrate Subscriptions
        const sqliteSubscriptions = sqliteDb.prepare('SELECT * FROM subscriptions').all();
        console.log(`Migrating ${sqliteSubscriptions.length} subscriptions...`);
        for (const sub of sqliteSubscriptions) {
            const [existing] = await mysqlPool.execute('SELECT id FROM subscriptions WHERE id = ?', [sub.id]);
            if (existing.length > 0) continue;

            await mysqlPool.execute(
                `INSERT INTO subscriptions (id, user_id, plan_type, start_date, end_date, payment_status) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [sub.id, sub.user_id, sub.plan_type, sub.start_date, sub.end_date, sub.payment_status]
            );
        }
        console.log('✅ Subscriptions migrated.');

        console.log('🎉 Full Migration from SQLite to MySQL completed successfully!');
    } catch (error) {
        console.error('❌ Migration Error:', error);
    } finally {
        sqliteDb.close();
        await mysqlPool.end();
        console.log('🔌 Connections closed.');
    }
}

migrateData();
