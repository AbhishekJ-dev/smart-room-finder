const pool = require('./config/db');

async function check() {
    const r = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms' ORDER BY ordinal_position"
    );
    console.log('rooms columns:', r.rows.map(c => c.column_name).join(', '));
    
    // Add missing columns if needed
    const cols = r.rows.map(c => c.column_name);
    
    if (!cols.includes('city')) {
        await pool.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS city VARCHAR(255)");
        console.log('Added: city');
    }
    if (!cols.includes('annual_rent')) {
        await pool.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS annual_rent DECIMAL(10,2) DEFAULT 0.00");
        console.log('Added: annual_rent');
    }
    if (!cols.includes('tenant_type')) {
        await pool.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_type VARCHAR(50) DEFAULT 'Anyone'");
        console.log('Added: tenant_type');
    }
    if (!cols.includes('is_deleted')) {
        await pool.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE");
        console.log('Added: is_deleted');
    }
    
    // Check room_images
    const r2 = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'room_images' ORDER BY ordinal_position"
    );
    console.log('room_images columns:', r2.rows.map(c => c.column_name).join(', '));
    const cols2 = r2.rows.map(c => c.column_name);
    if (!cols2.includes('room_id')) {
        console.error('room_images is missing room_id!');
    }
    if (!cols2.includes('image_url')) {
        console.error('room_images is missing image_url!');
    }
    
    // Check users
    const r3 = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.log('users columns:', r3.rows.map(c => c.column_name).join(', '));
    const cols3 = r3.rows.map(c => c.column_name);
    
    if (!cols3.includes('otp_code')) {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10)");
        console.log('Added: otp_code');
    }
    if (!cols3.includes('otp')) {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(10)");
        console.log('Added: otp');
    }
    if (!cols3.includes('reset_otp')) {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10)");
        console.log('Added: reset_otp');
    }
    if (!cols3.includes('otp_expiry')) {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP");
        console.log('Added: otp_expiry');
    }
    if (!cols3.includes('is_verified')) {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE");
        console.log('Added: is_verified');
    }
    
    // Check subscription_plans
    const r4 = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'subscription_plans' ORDER BY ordinal_position"
    );
    console.log('subscription_plans columns:', r4.rows.map(c => c.column_name).join(', '));
    const cols4 = r4.rows.map(c => c.column_name);
    if (!cols4.includes('is_active')) {
        await pool.query("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE");
        console.log('Added: is_active to subscription_plans');
    }
    if (!cols4.includes('description')) {
        await pool.query("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT");
        console.log('Added: description to subscription_plans');
    }
    
    // Check subscriptions
    const r5 = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'subscriptions' ORDER BY ordinal_position"
    );
    console.log('subscriptions columns:', r5.rows.map(c => c.column_name).join(', '));
    const cols5 = r5.rows.map(c => c.column_name);
    if (!cols5.includes('payment_status')) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING'");
        console.log('Added: payment_status to subscriptions');
    } else {
        // Ensure default is PENDING
        await pool.query("ALTER TABLE subscriptions ALTER COLUMN payment_status SET DEFAULT 'PENDING'");
    }
    
    if (!cols5.includes('price')) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price DECIMAL(10,2)");
        console.log('Added: price to subscriptions');
    }

    if (cols5.includes('plan_type')) {
        // Make it nullable if it exists
        await pool.query("ALTER TABLE subscriptions ALTER COLUMN plan_type DROP NOT NULL");
        console.log('Made: plan_type nullable');
    }
    
    console.log('Schema check complete');
    process.exit(0);
}

check().catch(err => { console.error(err.message); process.exit(1); });
