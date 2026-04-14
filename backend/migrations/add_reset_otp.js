const db = require('../config/db');

async function migrate() {
    try {
        console.log('🚀 Starting migration: Adding reset_otp to users table...');
        
        // Add reset_otp column
        await db.execute(`
            ALTER TABLE users 
            ADD COLUMN reset_otp VARCHAR(10) NULL AFTER otp_code
        `);
        
        console.log('✅ Migration successful: reset_otp added.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('ℹ️ Column reset_otp already exists. Skipping.');
            process.exit(0);
        } else {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
    }
}

migrate();
