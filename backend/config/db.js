const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'smart_room_finder.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'owner')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('1BHK', '2BHK', 'PG', 'Room')),
        price_daily REAL,
        price_weekly REAL,
        price_monthly REAL,
        price_quarterly REAL,
        price_yearly REAL,
        area TEXT NOT NULL,
        location TEXT NOT NULL,
        contact TEXT NOT NULL,
        description TEXT,
        photos TEXT,
        is_booked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_type TEXT NOT NULL CHECK(plan_type IN ('7_days', '30_days')),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        payment_status TEXT DEFAULT 'completed',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        duration TEXT NOT NULL,
        booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'confirmed',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
`);

console.log('✅ SQLite database connected and tables created.');

module.exports = db;
