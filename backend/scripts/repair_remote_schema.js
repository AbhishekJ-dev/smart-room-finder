const mysql = require('mysql2/promise');
require('dotenv').config();

async function repairSchema() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    const connection = await pool.getConnection();

    try {
        console.log("🚀 Starting Remote Schema Repair...");

        await connection.beginTransaction();

        // 1. Create subscription_plans table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                duration_days INT NOT NULL,
                description TEXT,
                is_active TINYINT(1) DEFAULT 1,
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

        // 3. Update subscriptions table
        const [columns] = await connection.execute('SHOW COLUMNS FROM subscriptions');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('plan_id')) {
            console.log("Adding plan_id to subscriptions...");
            await connection.execute('ALTER TABLE subscriptions ADD COLUMN plan_id INT AFTER user_id');
            
            // Set plan_id for existing rows based on plan_type if possible, or just default to 1
            await connection.execute('UPDATE subscriptions SET plan_id = 1 WHERE plan_id IS NULL');
            
            // Add Foreign Key (Note: MySQL 5.5 might be picky about engine types, but usually works)
            try {
                await connection.execute('ALTER TABLE subscriptions ADD CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)');
                console.log("✅ Added plan_id column and foreign key");
            } catch (fkErr) {
                console.log("⚠️ FK add failed (probably existing bad data or engine mismatch), column added without constraint.");
            }
        }

        if (!columnNames.includes('is_active')) {
            await connection.execute('ALTER TABLE subscriptions ADD COLUMN is_active TINYINT(1) DEFAULT 0 AFTER payment_status');
            console.log("✅ Added is_active column");
        }

        // 4. Ensure DATE columns are NULLable as requested by new logic
        await connection.execute('ALTER TABLE subscriptions MODIFY COLUMN start_date DATETIME NULL');
        await connection.execute('ALTER TABLE subscriptions MODIFY COLUMN end_date DATETIME NULL');
        console.log("✅ Made dates nullable");

        await connection.commit();
        console.log("🎉 Remote database schema repaired!");

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Repair failed:", error.message);
    } finally {
        if (connection) connection.release();
        await pool.end();
        process.exit(0);
    }
}

repairSchema();
