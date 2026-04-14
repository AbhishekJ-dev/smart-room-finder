const db = require('./config/db');

(async () => {
    try {
        console.log("Altering DB to add new columns...");
        
        // Add new columns (ignore if they exist)
        try {
            await db.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;');
        } catch(e) { console.log('is_verified already exists or error:', e.message); }
        
        try {
            await db.execute('ALTER TABLE users ADD COLUMN otp_code VARCHAR(10);');
        } catch(e) { console.log('otp_code already exists or error:', e.message); }
        
        try {
            await db.execute('ALTER TABLE users ADD COLUMN otp_expiry DATETIME;');
        } catch(e) { console.log('otp_expiry already exists or error:', e.message); }
        
        try {
            await db.execute('ALTER TABLE users ADD COLUMN temp_email VARCHAR(255);');
        } catch(e) { console.log('temp_email already exists or error:', e.message); }

        console.log("If is_email_verified exists, updating is_verified and handling existing data...");
        try {
            // we will copy the is_email_verified to is_verified just in case
            await db.execute('UPDATE users SET is_verified = is_email_verified WHERE is_email_verified IS NOT NULL;');
            // drop the old one if needed, but safe to just leave it or rename
        } catch(e) { console.log('is_email_verified error:', e.message); }

        console.log("DB update complete.");
    } catch(err) {
        console.error("Fatal error:", err);
    } finally {
        process.exit(0);
    }
})();
