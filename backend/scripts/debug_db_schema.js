const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRemoteDB() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        const [tables] = await pool.execute('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        console.log('Tables found:', tableList);

        if (tableList.includes('subscriptions')) {
            const [columns] = await pool.execute('DESCRIBE subscriptions');
            console.log('Columns in subscriptions:', columns.map(c => c.Field));
        } else {
            console.log('❌ Table "subscriptions" is MISSING');
        }

        if (tableList.includes('subscription_plans')) {
            const [columns] = await pool.execute('DESCRIBE subscription_plans');
            console.log('Columns in subscription_plans:', columns.map(c => c.Field));
        } else {
            console.log('❌ Table "subscription_plans" is MISSING');
        }

    } catch (err) {
        console.error('Error checking DB:', err.message);
    } finally {
        await pool.end();
    }
}

checkRemoteDB();
