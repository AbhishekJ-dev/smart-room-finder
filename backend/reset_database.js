/**
 * reset_database.js
 * 
 * Standalone script to safely wipe ALL data from the Smart Room Finder database.
 * Tables are preserved — only rows are deleted. Auto-increment counters are reset.
 * 
 * Usage:  node reset_database.js
 */

const db = require('./config/db');

async function resetDatabase() {
    const connection = await db.getConnection();

    console.log('\n🔄 Starting database reset...\n');

    try {
        await connection.beginTransaction();

        // 1. Disable FK checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('🔓 Foreign key checks disabled.');

        // 2. Tables in safe deletion order (children → parents)
        const tables = [
            'commissions',
            'payments',
            'bookings',
            'subscriptions',
            'room_images',
            'rooms',
            'admins',
            'owners',
            'users'
        ];

        // 3. Delete all rows from each table
        for (const table of tables) {
            try {
                const [result] = await connection.execute(`DELETE FROM ${table}`);
                console.log(`   ✅ ${table.padEnd(16)} → ${result.affectedRows} rows deleted`);
            } catch (err) {
                console.log(`   ⚠️  ${table.padEnd(16)} → skipped (${err.code || err.message})`);
            }
        }

        // 4. Reset auto-increment counters
        console.log('\n🔢 Resetting auto-increment counters...');
        for (const table of tables) {
            try {
                await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
            } catch (_) {}
        }

        // 5. Re-enable FK checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🔒 Foreign key checks re-enabled.');

        await connection.commit();
        console.log('\n✅ Database reset completed successfully! All tables are empty.\n');

    } catch (error) {
        await connection.rollback();
        try { await connection.execute('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
        console.error('\n❌ Reset failed:', error.message, '\n');
    } finally {
        connection.release();
        process.exit(0);
    }
}

resetDatabase();
