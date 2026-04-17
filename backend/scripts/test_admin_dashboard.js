const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAdminDashboard() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    console.log("--- Testing Dashboard Stats Queries ---");
    const statsQueries = {
        users: 'SELECT COUNT(*) as count FROM users WHERE role != "admin" AND is_deleted = 0',
        rooms: 'SELECT COUNT(*) as count FROM rooms',
        bookings: 'SELECT COUNT(*) as count FROM bookings',
        active_subs: 'SELECT COUNT(*) as count FROM subscriptions WHERE is_active = 1 AND end_date >= NOW()',
        revenue: 'SELECT COALESCE(SUM(price), 0) as total FROM subscriptions WHERE payment_status = "paid"'
    };

    for (const [name, sql] of Object.entries(statsQueries)) {
        try {
            const [res] = await conn.execute(sql);
            console.log(`✅ ${name}:`, res[0]);
        } catch (e) {
            console.log(`❌ ${name} FAILED:`, e.message);
        }
    }

    console.log("\n--- Testing Recent Activity Queries ---");
    const activityQueries = {
        rooms: `SELECT 'property' as type, CONCAT('New property in ', city, ', ', area) as message, 'New Listing' as badge, 'green' as color, created_at FROM rooms ORDER BY created_at DESC LIMIT 4`,
        bookings: `SELECT 'booking' as type, CONCAT('Booking by ', u.name) as message, b.status as badge, 'blue' as color, b.booking_date as created_at FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.booking_date DESC LIMIT 3`,
        users: `SELECT 'user' as type, CONCAT(name, ' joined as ', role) as message, 'New User' as badge, 'purple' as color, created_at FROM users WHERE role != 'admin' AND is_deleted = 0 ORDER BY created_at DESC LIMIT 3`,
        subs: `SELECT 'subscription' as type, CONCAT(u.name, ' subscribed') as message, 'Subscribed' as badge, 'amber' as color, s.created_at FROM subscriptions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 3`
    };

    for (const [name, sql] of Object.entries(activityQueries)) {
        try {
            const [res] = await conn.execute(sql);
            console.log(`✅ ${name}: Found ${res.length} items`);
        } catch (e) {
            console.log(`❌ ${name} FAILED:`, e.message);
        }
    }

    await conn.end();
}

testAdminDashboard();
