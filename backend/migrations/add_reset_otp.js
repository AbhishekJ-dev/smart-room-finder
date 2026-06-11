/**
 * Migration: Add reset_otp and otp_code columns to users table
 * PostgreSQL (Neon) compatible
 */
const pool = require('../config/db');

async function migrate() {
    try {
        console.log('[migration] Running: add_reset_otp...');

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS reset_otp  VARCHAR(10) NULL,
            ADD COLUMN IF NOT EXISTS otp_code   VARCHAR(10) NULL,
            ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP  NULL
        `);
        console.log('[migration] ✅ users: reset_otp, otp_code, otp_expiry added (or already exist)');

        console.log('[migration] ✅ add_reset_otp completed.');
        process.exit(0);
    } catch (error) {
        console.error('[migration] ❌ add_reset_otp failed:', error.message);
        process.exit(1);
    }
}

migrate();
