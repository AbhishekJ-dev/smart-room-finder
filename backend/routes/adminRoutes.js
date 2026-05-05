const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware inside since it's an admin route
const adminAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ─── ADMIN DASHBOARD STATISTICS ───
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const [usersRes, propertiesRes, bookingsRes, subsRes, revenueRes] = await Promise.all([
            pool.query("SELECT COUNT(*)::INT as count FROM users WHERE role != 'admin'"),
            pool.query('SELECT COUNT(*)::INT as count FROM rooms'),
            pool.query('SELECT COUNT(*)::INT as count FROM bookings'),
            pool.query('SELECT COUNT(*)::INT as count FROM subscriptions WHERE is_active = true AND end_date >= NOW()'),
            pool.query("SELECT COALESCE(SUM(price), 0)::NUMERIC as total FROM subscriptions WHERE payment_status = 'SUCCESS'")
        ]);

        res.json({
            total_users: usersRes.rows[0]?.count || 0,
            total_properties: propertiesRes.rows[0]?.count || 0,
            total_bookings: bookingsRes.rows[0]?.count || 0,
            active_subscriptions: subsRes.rows[0]?.count || 0,
            total_revenue: revenueRes.rows[0]?.total || 0
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// ─── RECENT ACTIVITY (Live feed from DB) ───
router.get('/recent-activity', adminAuth, async (req, res) => {
    try {
        const { rows: rooms } = await pool.query(
            `SELECT 'property' as type, CONCAT('New property in ', city, ', ', area) as message, 'New Listing' as badge, 'green' as color, created_at FROM rooms ORDER BY created_at DESC LIMIT 4`
        );
        const { rows: bookings } = await pool.query(
            `SELECT 'booking' as type, CONCAT('Booking by ', u.name) as message, b.status as badge, 'blue' as color, b.booking_date as created_at FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.booking_date DESC LIMIT 3`
        );
        const { rows: newUsers } = await pool.query(
            `SELECT 'user' as type, CONCAT(name, ' joined as ', role) as message, 'New User' as badge, 'purple' as color, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 3`
        );
        const { rows: subs } = await pool.query(
            `SELECT 'subscription' as type, CONCAT(u.name, ' subscribed') as message, 'Subscribed' as badge, 'amber' as color, s.created_at FROM subscriptions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 3`
        );

        const all = [...rooms, ...bookings, ...newUsers, ...subs]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 8);

        res.json(all);
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE USERS (Tenants & Owners) ───
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { rows: users } = await pool.query(
            "SELECT id, name, email, role, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC"
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE PROPERTIES (Drill-down: Owners List) ───
router.get('/owners', adminAuth, async (req, res) => {
    try {
        const { rows: owners } = await pool.query(`
            SELECT u.id as owner_id, u.email, COUNT(r.id)::INT as total_properties 
            FROM users u
            JOIN rooms r ON u.id = r.owner_id
            WHERE u.role = 'owner'
            GROUP BY u.id, u.email
            ORDER BY total_properties DESC
        `);
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE PROPERTIES (Drill-down: Specific Owner's Rooms) ───
router.get('/properties/owner/:ownerId', adminAuth, async (req, res) => {
    try {
        const { rows: rooms } = await pool.query(`
            SELECT r.*, u.name as owner_name, u.email as owner_email 
            FROM rooms r
            JOIN users u ON r.owner_id = u.id
            WHERE r.owner_id = $1
            ORDER BY r.created_at DESC
        `, [req.params.ownerId]);

        const roomsWithImages = await Promise.all(rooms.map(async (room) => {
            const { rows: images } = await pool.query('SELECT image_url FROM room_images WHERE room_id = $1', [room.id]);
            return {
                ...room,
                photos: images.map(img => img.image_url)
            };
        }));

        res.json(roomsWithImages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE PROPERTIES (Compatibility: All listed) ───
router.get('/properties', adminAuth, async (req, res) => {
    try {
        const { rows: rooms } = await pool.query(`
            SELECT r.*, u.name as owner_name, u.email as owner_email 
            FROM rooms r
            JOIN users u ON r.owner_id = u.id
            ORDER BY r.created_at DESC
        `);

        const roomsWithImages = await Promise.all(rooms.map(async (room) => {
            const { rows: images } = await pool.query('SELECT image_url FROM room_images WHERE room_id = $1', [room.id]);
            return {
                ...room,
                photos: images.map(img => img.image_url)
            };
        }));

        res.json(roomsWithImages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE BOOKINGS ───
router.get('/bookings', adminAuth, async (req, res) => {
    try {
        const { rows: bookings } = await pool.query(`
            SELECT b.*, 
                   u.name as user_name, u.email as user_email,
                   r.area as property_area, r.type as property_type,
                   o.name as owner_name, o.email as owner_email
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN rooms r ON b.room_id = r.id
            JOIN users o ON r.owner_id = o.id
            ORDER BY b.booking_date DESC
        `);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── UPDATE BOOKING STATUS ───
router.patch('/bookings/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const { rows: result } = await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── SOFT DELETE USER ───
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_deleted = true WHERE id = $1', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET TENANT SUBSCRIPTIONS ───
router.get('/subscriptions', adminAuth, async (req, res) => {
    try {
        const { rows: subs } = await pool.query(`
            SELECT s.*, p.name as plan_name, u.name as user_name, u.email as user_email
            FROM subscriptions s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN subscription_plans p ON s.plan_id = p.id
            ORDER BY s.created_at DESC
        `);
        res.json(subs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── TOGGLE SUBSCRIPTION STATUS ───
router.put('/subscriptions/:id/toggle', adminAuth, async (req, res) => {
    try {
        const { rows: sub } = await pool.query('SELECT is_active FROM subscriptions WHERE id = $1', [req.params.id]);
        if (sub.length === 0) return res.status(404).json({ message: 'Subscription not found' });
        
        const newStatus = !sub[0].is_active;
        await pool.query('UPDATE subscriptions SET is_active = $1 WHERE id = $2', [newStatus, req.params.id]);
        
        res.json({ message: 'Subscription status updated', is_active: newStatus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DELETE PROPERTY ───
router.delete('/properties/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE SUBSCRIPTION PLANS ───
router.get('/plans', adminAuth, async (req, res) => {
    try {
        const { rows: plans } = await pool.query('SELECT * FROM subscription_plans ORDER BY price ASC');
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/plans', adminAuth, async (req, res) => {
    try {
        const { name, price, duration_days, description } = req.body;
        await pool.query(
            'INSERT INTO subscription_plans (name, price, duration_days, description) VALUES ($1, $2, $3, $4)',
            [name, price, duration_days, description]
        );
        res.status(201).json({ message: 'Plan created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/plans/:id', adminAuth, async (req, res) => {
    try {
        const { name, price, duration_days, description } = req.body;
        await pool.query(
            'UPDATE subscription_plans SET name=$1, price=$2, duration_days=$3, description=$4 WHERE id=$5',
            [name, price, duration_days, description, req.params.id]
        );
        res.json({ message: 'Plan updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/plans/:id/toggle', adminAuth, async (req, res) => {
    try {
        const { rows: plan } = await pool.query('SELECT is_active FROM subscription_plans WHERE id = $1', [req.params.id]);
        if (plan.length === 0) return res.status(404).json({ message: 'Plan not found' });
        
        const newStatus = !plan[0].is_active;
        await pool.query('UPDATE subscription_plans SET is_active = $1 WHERE id = $2', [newStatus, req.params.id]);
        
        res.json({ message: `Plan ${newStatus ? 'enabled' : 'disabled'} successfully`, is_active: newStatus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── RESET ALL DATA (Admin Only) ───
// DELETE /api/admin/reset-data
// Safely deletes ALL user data while preserving table structure.
router.delete('/reset-data', adminAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete in safe dependency order (children -> parents)
        const tables = [
            'commissions',
            'payments',
            'bookings',
            'subscriptions',
            'room_images',
            'rooms',
            'admins',
            'owners',
            'users'
        ];

        const results = {};
        for (const table of tables) {
            try {
                const result = await client.query(`DELETE FROM ${table}`);
                results[table] = result.rowCount;
            } catch (err) {
                results[table] = `skipped (${err.code || 'not found'})`;
            }
        }

        // Reset PostgreSQL sequences
        for (const table of tables) {
            try {
                await client.query(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1`);
            } catch (err) {
                // Ignore if sequence doesn't exist
            }
        }

        await client.query('COMMIT');

        console.log('🗑️  Database reset completed:', results);
        res.json({
            message: '✅ All data deleted successfully. Database is clean.',
            deleted: results
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Reset Error:', error);
        res.status(500).json({ message: 'Reset failed: ' + error.message });
    } finally {
        client.release();
    }
});

module.exports = router;
