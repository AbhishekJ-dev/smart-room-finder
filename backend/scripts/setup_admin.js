/**
 * setup_admin.js (PostgreSQL / Neon Version)
 * Usage: node scripts/setup_admin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
    const email = 'abhishekj.mca@gmail.com';
    const password = 'Admin@123'; // Temporary password
    const name = 'System Admin';
    const role = 'super_admin';

    try {
        console.log(`🚀 Setting up Admin: ${email}...`);

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Check if user exists
        const { rows: users } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        let userId;

        if (users.length > 0) {
            userId = users[0].id;
            console.log('⚡ User exists. Updating to Admin role...');
            await pool.query(
                'UPDATE users SET role = $1, password = $2, is_verified = TRUE, is_deleted = FALSE WHERE id = $3',
                [role, hashedPassword, userId]
            );
        } else {
            console.log('📦 Creating new Admin user...');
            const { rows: newUser } = await pool.query(
                'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING id',
                [name, email, hashedPassword, role]
            );
            userId = newUser[0].id;
        }

        // 2. Ensure Admin profile exists
        const { rows: admins } = await pool.query('SELECT id FROM admins WHERE user_id = $1', [userId]);
        if (admins.length === 0) {
            console.log('➕ Creating admin profile record...');
            await pool.query('INSERT INTO admins (user_id, permissions) VALUES ($1, $2)', [userId, 'ALL_ACCESS']);
        }

        console.log('✅ Admin account configured successfully.');
        console.log('---');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('---');
        console.log('Please log in and change your password immediately.');

    } catch (err) {
        console.error('❌ Setup failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

setupAdmin();
