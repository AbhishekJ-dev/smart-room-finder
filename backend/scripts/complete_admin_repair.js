const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPriceColumn() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log("Checking for 'price' column in subscriptions...");
        const [columns] = await conn.execute('SHOW COLUMNS FROM subscriptions');
        if (!columns.some(c => c.Field === 'price')) {
            await conn.execute('ALTER TABLE subscriptions ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER plan_id');
            console.log("✅ Added 'price' column to subscriptions table.");
        } else {
            console.log("ℹ️ 'price' column already exists.");
        }
    } catch (error) {
        console.error("❌ Failed to add column:", error.message);
    } finally {
        await conn.end();
        process.exit(0);
    }
}

addPriceColumn();
