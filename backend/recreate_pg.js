const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'smart_room_finder',
        password: 'Abhi@0518',
        port: 5432
    });

    try {
        await client.connect();
        console.log('Connected');
        
        // Drop all tables
        await client.query(`
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS payments CASCADE;
            DROP TABLE IF EXISTS commissions CASCADE;
            DROP TABLE IF EXISTS bookings CASCADE;
            DROP TABLE IF EXISTS subscriptions CASCADE;
            DROP TABLE IF EXISTS subscription_plans CASCADE;
            DROP TABLE IF EXISTS room_images CASCADE;
            DROP TABLE IF EXISTS rooms CASCADE;
            DROP TABLE IF EXISTS admins CASCADE;
            DROP TABLE IF EXISTS owners CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);
        console.log('Dropped all tables');

        const schema = fs.readFileSync('pg_schema.sql', 'utf8');
        await client.query(schema);
        console.log('Recreated schema successfully');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
