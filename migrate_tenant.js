const db = require('./backend/config/db');

async function migrate() {
    try {
        const pool = await db.getConnection();
        
        console.log("Adding tenant_type column...");
        await pool.execute("ALTER TABLE rooms ADD COLUMN tenant_type ENUM('Boys', 'Girls', 'Anyone') DEFAULT 'Anyone';");
        console.log("Column added successfully.");
        
        pool.release();
        process.exit(0);
    } catch (e) {
        // Ignore duplicate column errors if it already exists
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists. Skipping.");
            process.exit(0);
        } else {
            console.error("Migration failed:", e);
            process.exit(1);
        }
    }
}

migrate();
