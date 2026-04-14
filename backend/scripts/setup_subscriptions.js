const db = require('../config/db');

async function setupSubscriptions() {
    const connection = await db.getConnection();
    try {
        console.log("🚀 Starting Subscription System Migration...");

        await connection.beginTransaction();

        // 1. Create subscription_plans table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                duration_days INT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Created subscription_plans table");

        // 2. Insert default plans if none exist
        const [existingPlans] = await connection.execute('SELECT COUNT(*) as count FROM subscription_plans');
        if (existingPlans[0].count === 0) {
            await connection.execute(`
                INSERT INTO subscription_plans (name, price, duration_days, description) VALUES 
                ('Weekly Pro', 199.00, 7, 'Access to all room details and booking for 7 days.'),
                ('Monthly Premium', 599.00, 30, 'Access to all room details and booking for 30 days.')
            `);
            console.log("✅ Inserted default plans");
        }

        // 3. Update subscriptions table to include plan_id and razorpay fields
        // Note: We check if columns exist first to avoid errors on rerun
        const [columns] = await connection.execute('SHOW COLUMNS FROM subscriptions');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('plan_id')) {
            await connection.execute('ALTER TABLE subscriptions ADD COLUMN plan_id INT AFTER user_id');
            await connection.execute('ALTER TABLE subscriptions ADD CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)');
            console.log("✅ Added plan_id column and foreign key");
        }

        if (!columnNames.includes('razorpay_order_id')) {
            await connection.execute('ALTER TABLE subscriptions ADD COLUMN razorpay_order_id VARCHAR(255) AFTER price');
            console.log("✅ Added razorpay_order_id column");
        }

        if (!columnNames.includes('razorpay_payment_id')) {
            await connection.execute('ALTER TABLE subscriptions ADD COLUMN razorpay_payment_id VARCHAR(255) AFTER razorpay_order_id');
            console.log("✅ Added razorpay_payment_id column");
        }

        if (!columnNames.includes('is_active')) {
            await connection.execute('ALTER TABLE subscriptions ADD COLUMN is_active BOOLEAN DEFAULT FALSE AFTER payment_status');
            console.log("✅ Added is_active column");
        }

        // Ensure dates are NULL for pending payments
        await connection.execute('ALTER TABLE subscriptions MODIFY COLUMN start_date DATETIME NULL');
        await connection.execute('ALTER TABLE subscriptions MODIFY COLUMN end_date DATETIME NULL');

        await connection.commit();
        console.log("🎉 Subscription system setup completed successfully!");
        process.exit(0);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Setup failed:", error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

setupSubscriptions();
