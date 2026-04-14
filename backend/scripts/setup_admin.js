const db = require('../config/db');
const bcrypt = require('bcryptjs');

const setupAdmin = async () => {
    const email = 'abhishekj.mca@gmail.com';
    const password = 'Abhij@05182002';
    const name = 'Abhishek J';
    const role = 'admin';

    try {
        console.log(`🚀 Setting up admin account for: ${email}...`);

        // Check if user exists
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        const hashedPassword = await bcrypt.hash(password, 10);

        if (users.length > 0) {
            console.log('📝 User already exists. Updating role to admin and marking as verified...');
            await db.execute(
                'UPDATE users SET role = ?, password = ?, is_verified = 1 WHERE email = ?',
                [role, hashedPassword, email]
            );
        } else {
            console.log('➕ User does not exist. Creating new verified admin account...');
            await db.execute(
                'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
                [name, email, hashedPassword, role]
            );
        }

        // Get the user ID
        const [updatedUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        const userId = updatedUsers[0].id;

        // Ensure admin profile exists in 'admins' table
        const [admins] = await db.execute('SELECT * FROM admins WHERE user_id = ?', [userId]);
        if (admins.length === 0) {
            console.log('🔧 Creating entry in admins table...');
            await db.execute('INSERT INTO admins (user_id) VALUES (?)', [userId]);
        }

        console.log('✅ Admin setup successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Admin setup failed:', error);
        process.exit(1);
    }
};

setupAdmin();
