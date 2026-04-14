const db = require('../config/db');

async function migrate_is_deleted() {
    try {
        console.log('Migrating database: adding `is_deleted` to users table...');
        
        // Add is_deleted column if it doesn't exist
        const [columns] = await db.execute("SHOW COLUMNS FROM users LIKE 'is_deleted'");
        if (columns.length === 0) {
            await db.execute("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT 0");
            console.log('✅ added `is_deleted` column to users table.');
        } else {
            console.log('⚡ `is_deleted` column already exists.');
        }

        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate_is_deleted();
