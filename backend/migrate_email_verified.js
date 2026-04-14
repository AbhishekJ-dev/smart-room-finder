const db = require('./config/db');

async function fix() {
  try {
    // 1. Change column default to 0 (unverified by default)
    await db.execute('ALTER TABLE users MODIFY COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0');
    console.log('✅ Column default changed to 0 (unverified).');

    // 2. Reset ALL existing users to unverified (they must go through OTP to verify)
    const [result] = await db.execute('UPDATE users SET is_email_verified = 0');
    console.log(`✅ Reset ${result.affectedRows} user(s) to unverified status.`);

    console.log('\n✅ Done! All users now show as Unverified. They must click "Verify Now" to verify their account.');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    process.exit(0);
  }
}

fix();
