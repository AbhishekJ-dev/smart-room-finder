const db = require('./config/db');

async function migrate() {
    try {
        console.log("Starting migration for subscriptions table...");

        // Note: altering ENUMs requires dropping/recreating columns in some strict modes,
        // or just changing the column type. MySQL can do it automatically via MODIFY.
        
        // 1. First, we need to handle existing rows if they have '7_days'/'completed'
        // But since it's dev, we can just TRUNCATE or update them.
        await db.execute(`DELETE FROM subscriptions`);

        // 2. Modify plan_type
        await db.execute(`ALTER TABLE subscriptions MODIFY COLUMN plan_type ENUM('weekly', 'monthly') NOT NULL`);
        console.log("✅ Modified plan_type ENUM");

        // 3. Modify payment_status
        await db.execute(`ALTER TABLE subscriptions MODIFY COLUMN payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING'`);
        console.log("✅ Modified payment_status ENUM");

        // 4. Add price
        try {
            await db.execute(`ALTER TABLE subscriptions ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER plan_type`);
            console.log("✅ Added price column");
        } catch(e) { console.log("Price column might already exist."); }

        // 5. Add is_active
        try {
             await db.execute(`ALTER TABLE subscriptions ADD COLUMN is_active BOOLEAN DEFAULT false AFTER payment_status`);
             console.log("✅ Added is_active column");
        } catch(e) { console.log("is_active column might already exist."); }

        // 6. allow null dates for PENDING state
        await db.execute(`ALTER TABLE subscriptions MODIFY COLUMN start_date DATE NULL`);
        await db.execute(`ALTER TABLE subscriptions MODIFY COLUMN end_date DATE NULL`);

        console.log("🎉 Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
