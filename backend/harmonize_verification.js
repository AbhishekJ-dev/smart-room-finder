const db = require('./config/db');

async function migrate() {
  console.log('🚀 Starting Verification Column Harmonization...');
  try {
    const [cols] = await db.execute('DESCRIBE users');
    const columnNames = cols.map(c => c.Field);
    
    // 1. Ensure 'is_verified' exists (it should, but let's be safe)
    if (!columnNames.includes('is_verified')) {
      console.log('➕ Adding missing is_verified column...');
      await db.execute('ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0');
    }

    // 2. If 'is_email_verified' exists, merge data and drop it
    if (columnNames.includes('is_email_verified')) {
      console.log('🔄 Merging is_email_verified into is_verified...');
      
      // Copy 1s from is_email_verified to is_verified
      await db.execute('UPDATE users SET is_verified = 1 WHERE is_email_verified = 1');
      
      console.log('🗑️ Dropping redundant is_email_verified column...');
      await db.execute('ALTER TABLE users DROP COLUMN is_email_verified');
    }

    // 3. Ensure other required columns exist
    if (!columnNames.includes('temp_email')) {
      await db.execute('ALTER TABLE users ADD COLUMN temp_email VARCHAR(255) NULL');
    }
    if (!columnNames.includes('otp')) {
      await db.execute('ALTER TABLE users ADD COLUMN otp VARCHAR(6) NULL');
    }
    if (!columnNames.includes('otp_expiry')) {
      await db.execute('ALTER TABLE users ADD COLUMN otp_expiry DATETIME NULL');
    }

    console.log('✅ Database Harmonization Complete!');
  } catch (err) {
    console.error('❌ Migration Failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
