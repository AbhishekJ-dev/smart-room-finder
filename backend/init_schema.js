/**
 * init_schema.js
 * Run this ONCE against your Neon PostgreSQL database to create all tables.
 *
 * Usage: node init_schema.js
 *
 * Make sure DATABASE_URL is set in your .env before running.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not set. Check your .env file.');
        process.exit(1);
    }

    console.log('🚀 Connecting to Neon PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
        console.error('❌ schema.sql not found at:', schemaPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');

    try {
        console.log('📦 Running schema.sql...');
        await client.query(sql);
        console.log('✅ Schema applied successfully. All tables are ready.');
    } catch (err) {
        console.error('❌ Schema run failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
