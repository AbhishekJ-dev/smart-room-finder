const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'smart_room_finder',
    port: process.env.DB_PORT || 3306,
});

async function testFetch() {
    try {
        const [subs] = await db.execute(`
            SELECT s.*, p.name as plan_name, u.name as user_name, u.email as user_email
            FROM subscriptions s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN subscription_plans p ON s.plan_id = p.id
            ORDER BY s.created_at DESC
        `);
        console.log('✅ Successfully fetched', subs.length, 'subscriptions');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fetch failed:', err.message);
        process.exit(1);
    }
}

testFetch();
