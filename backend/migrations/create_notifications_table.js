/**
 * Migration: Create notifications table (PostgreSQL / Neon compatible)
 */
const pool = require('../config/db');

(async () => {
    try {
        console.log('[migration] Creating notifications table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id         SERIAL PRIMARY KEY,
                user_id    INT          NOT NULL,
                title      VARCHAR(255) NOT NULL DEFAULT 'Notification',
                message    TEXT         NOT NULL,
                type       VARCHAR(50)  NOT NULL DEFAULT 'info',
                is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications (is_read)`);

        console.log('[migration] ✅ notifications table created (or already exists).');
    } catch (err) {
        console.error('[migration] ❌ create_notifications_table failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
})();
