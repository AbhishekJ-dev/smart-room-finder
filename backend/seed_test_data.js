/**
 * seed_test_data.js
 * 
 * Seeds the database with test accounts and a booking for verification.
 * Run: node seed_test_data.js
 */

const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    const connection = await db.getConnection();
    console.log('🌱 Seeding test data...');

    try {
        await connection.beginTransaction();

        // 1. Disable FK checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 2. Clear existing (just in case)
        const tables = ['bookings', 'rooms', 'owners', 'users', 'commissions'];
        for (const table of tables) await connection.execute(`DELETE FROM ${table}`);
        for (const table of tables) await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);

        const hashedPassword = await bcrypt.hash('pass123', 10);

        // 3. Create Owner
        const [ownerResult] = await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Test Owner', 'owner@test.com', hashedPassword, 'owner']
        );
        const ownerId = ownerResult.insertId;
        await connection.execute('INSERT INTO owners (user_id) VALUES (?)', [ownerId]);

        // 4. Create Guest
        const [guestResult] = await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Guest User', 'guest@test.com', hashedPassword, 'user']
        );
        const guestId = guestResult.insertId;

        // 5. Create Room
        const photos = JSON.stringify(['/uploads/placeholder1.jpg', '/uploads/placeholder2.jpg', '/uploads/placeholder3.jpg', '/uploads/placeholder4.jpg', '/uploads/placeholder5.jpg']);
        const [roomResult] = await connection.execute(
            `INSERT INTO rooms (owner_id, type, area, location, contact, price_monthly, photos, description, is_booked) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ownerId, '2BHK', 'Malviya Nagar', 'C-42, Jaipur', '9988776655', 15000, photos, 'Beautiful 2BHK room with all amenities.', 1]
        );
        const roomId = roomResult.insertId;

        // 6. Create Booking
        await connection.execute(
            `INSERT INTO bookings (user_id, room_id, duration, total_price, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [guestId, roomId, '1 Month', 15000, 'pending']
        );

        // 7. Create Confirmed Booking (for revenue test)
        const [roomResult2] = await connection.execute(
            `INSERT INTO rooms (owner_id, type, area, location, contact, price_monthly, photos, description, is_booked) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ownerId, '1BHK', 'Koramangala', 'Bangalore', '9988776655', 12000, photos, 'Compact 1BHK.', 1]
        );
        const roomId2 = roomResult2.insertId;

        await connection.execute(
            `INSERT INTO bookings (user_id, room_id, duration, total_price, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [guestId, roomId2, '1 Month', 12000, 'confirmed']
        );

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();

        console.log('\n✅ Database seeded successfully!');
        console.log('   - Owner: owner@test.com / pass123');
        console.log('   - Guest: guest@test.com / pass123');
        console.log('   - 1 Pending Booking');
        console.log('   - 1 Confirmed Booking (Revenue: ₹12,000)\n');

    } catch (err) {
        await connection.rollback();
        console.error('❌ Seeding failed:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

seed();
