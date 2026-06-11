const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
    console.log('[DB] New client connected to Neon PostgreSQL');
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message);
    // Do NOT process.exit here — let Postgres retry on next query
});

module.exports = pool;
