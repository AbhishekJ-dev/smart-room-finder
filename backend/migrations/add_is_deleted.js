/**
 * Migration: Add is_deleted and deleted_at columns to users and rooms tables
 * PostgreSQL (Neon) compatible
 */
const pool = require('../config/db');

async function migrate() {
    try {
        console.log('[migration] Running: add_is_deleted...');

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL
        `);
        console.log('[migration] ✅ users: is_deleted, deleted_at added (or already exists)');

        await pool.query(`
            ALTER TABLE rooms
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE
        `);
        console.log('[migration] ✅ rooms: is_deleted added (or already exists)');

        console.log('[migration] ✅ add_is_deleted completed.');
        process.exit(0);
    } catch (err) {
        console.error('[migration] ❌ add_is_deleted failed:', err.message);
        process.exit(1);
    }
}

migrate();
