/**
 * seed_test_data.js (PostgreSQL / Neon Version)
 * Usage: node backend/seed_test_data.js
 * 
 * Creates:
 * 1. Owner Account (owner@test.com / Password@123)
 * 2. Tenant Account (tenant@test.com / Password@123)
 * 3. 2 Room Listings with multiple images
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🌱 Starting Data Seeding...');
        const hashedPassword = await bcrypt.hash('Password@123', 10);

        // 1. Create Owner
        console.log('👤 Creating Owner...');
        const { rows: ownerResult } = await pool.query(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            ['John Owner', 'owner@test.com', hashedPassword, 'owner', true]
        );
        const ownerId = ownerResult[0].id;
        await pool.query('INSERT INTO owners (user_id, kyc_status, contact_number) VALUES ($1, $2, $3)', [ownerId, 'verified', '9876543210']);

        // 2. Create Tenant
        console.log('👤 Creating Tenant...');
        await pool.query(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5)',
            ['Alice Tenant', 'tenant@test.com', hashedPassword, 'tenant', true]
        );

        // 3. Create Sample Rooms
        console.log('🏘️ Creating Rooms...');
        const rooms = [
            {
                type: '1BHK',
                price: 12000,
                city: 'Bangalore',
                area: 'Koramangala',
                location: '7th Block, Koramangala, Bangalore',
                desc: 'Modern 1BHK with balcony and park view. Fully furnished.',
                images: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
                    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
                    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
                    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600'
                ]
            },
            {
                type: '2BHK',
                price: 25000,
                city: 'Mumbai',
                area: 'Andheri West',
                location: 'Lokhandwala Complex, Mumbai',
                desc: 'Luxury 2BHK in the heart of Mumbai. High floor, sea view.',
                images: [
                    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
                    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600',
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
                    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600'
                ]
            }
        ];

        for (const room of rooms) {
            const { rows: roomResult } = await pool.query(
                `INSERT INTO rooms (
                    owner_id, type, price_monthly, annual_rent, area, city, location, contact, description
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [ownerId, room.type, room.price, room.price * 12, room.area, room.city, room.location, '9876543210', room.desc]
            );
            const roomId = roomResult[0].id;

            for (const img of room.images) {
                await pool.query('INSERT INTO room_images (room_id, image_url) VALUES ($1, $2)', [roomId, img]);
            }
        }

        console.log('✅ Seeding Completed Successfully!');
        console.log('---');
        console.log('Test Accounts:');
        console.log('Owner: owner@test.com / Password@123');
        console.log('Tenant: tenant@test.com / Password@123');
        console.log('Rooms Created: 2');

    } catch (err) {
        console.error('❌ Seeding Failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

seed();
