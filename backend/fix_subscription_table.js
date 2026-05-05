const db = require('./config/db');

async function fixSchema() {
    try {
        console.log("🛠️ Starting Subscription Table Fix...");

        // 1. Drop old plan_type if it's strictly enforced but unused
        // (Optional, better to just keep it or make it nullable)

        // 2. Add Razorpay Columns
        console.log("Adding razorpay_order_id...");
        try {
            await db.execute(`ALTER TABLE subscriptions ADD COLUMN razorpay_order_id VARCHAR(255) AFTER price`);
        } catch(e) { console.log("razorpay_order_id might exist."); }

        console.log("Adding razorpay_payment_id...");
        try {
            await db.execute(`ALTER TABLE subscriptions ADD COLUMN razorpay_payment_id VARCHAR(255) AFTER razorpay_order_id`);
        } catch(e) { console.log("razorpay_payment_id might exist."); }

        // 3. Fix ENUMs and Nullability
        console.log("Updating payment_status ENUM and date nullability...");
        await db.execute(`
            ALTER TABLE subscriptions 
            MODIFY COLUMN payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
            MODIFY COLUMN start_date DATETIME NULL,
            MODIFY COLUMN end_date DATETIME NULL,
            MODIFY COLUMN plan_id INT NULL
        `);

        console.log("✅ Database schema synchronized!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    }
}

fixSchema();
