const express = require('express');
const db = require('../config/db');
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
        const [[usersRes], [propertiesRes], [bookingsRes], [subsRes], [revenueRes]] = await Promise.all([
            db.execute('SELECT COUNT(*) as count FROM users WHERE role != "admin" AND is_deleted = 0'),
            db.execute('SELECT COUNT(*) as count FROM rooms'),
            db.execute('SELECT COUNT(*) as count FROM bookings'),
            db.execute('SELECT COUNT(*) as count FROM subscriptions WHERE is_active = 1 AND end_date >= NOW()'),
            db.execute('SELECT COALESCE(SUM(price), 0) as total FROM subscriptions WHERE payment_status = "completed"')
        ]);

        res.json({
            total_users: usersRes[0]?.count || 0,
            total_properties: propertiesRes[0]?.count || 0,
            total_bookings: bookingsRes[0]?.count || 0,
            active_subscriptions: subsRes[0]?.count || 0,
            total_revenue: revenueRes[0]?.total || 0
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// ─── RECENT ACTIVITY (Live feed from DB) ───
router.get('/recent-activity', adminAuth, async (req, res) => {
    try {
        const [rooms] = await db.execute(
            `SELECT 'property' as type, CONCAT('New property in ', city, ', ', area) as message, 'New Listing' as badge, 'green' as color, created_at FROM rooms ORDER BY created_at DESC LIMIT 4`
        );
        const [bookings] = await db.execute(
            `SELECT 'booking' as type, CONCAT('Booking by ', u.name) as message, b.status as badge, 'blue' as color, b.booking_date as created_at FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.booking_date DESC LIMIT 3`
        );
        const [newUsers] = await db.execute(
            `SELECT 'user' as type, CONCAT(name, ' joined as ', role) as message, 'New User' as badge, 'purple' as color, created_at FROM users WHERE role != 'admin' AND is_deleted = 0 ORDER BY created_at DESC LIMIT 3`
        );
        const [subs] = await db.execute(
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
        const [users] = await db.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE role != "admin" AND is_deleted = 0 ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE PROPERTIES (Drill-down: Owners List) ───
router.get('/owners', adminAuth, async (req, res) => {
    try {
        const [owners] = await db.execute(`
            SELECT u.id as owner_id, u.email, COUNT(r.id) as total_properties 
            FROM users u
            JOIN rooms r ON u.id = r.owner_id
            WHERE u.role = 'owner' AND u.is_deleted = 0
            GROUP BY u.id
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
        const [rooms] = await db.execute(`
            SELECT r.*, u.name as owner_name, u.email as owner_email 
            FROM rooms r
            JOIN users u ON r.owner_id = u.id
            WHERE r.owner_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.ownerId]);

        const roomsWithImages = await Promise.all(rooms.map(async (room) => {
            const [images] = await db.execute('SELECT image_url FROM room_images WHERE room_id = ?', [room.id]);
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
        const [rooms] = await db.execute(`
            SELECT r.*, u.name as owner_name, u.email as owner_email 
            FROM rooms r
            JOIN users u ON r.owner_id = u.id
            ORDER BY r.created_at DESC
        `);

        const roomsWithImages = await Promise.all(rooms.map(async (room) => {
            const [images] = await db.execute('SELECT image_url FROM room_images WHERE room_id = ?', [room.id]);
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
        const [bookings] = await db.execute(`
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
        const [result] = await db.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── SOFT DELETE USER ───
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        await db.execute('UPDATE users SET is_deleted = 1 WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET TENANT SUBSCRIPTIONS ───
router.get('/subscriptions', adminAuth, async (req, res) => {
    try {
        const [subs] = await db.execute(`
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
        const [sub] = await db.execute('SELECT is_active FROM subscriptions WHERE id = ?', [req.params.id]);
        if (sub.length === 0) return res.status(404).json({ message: 'Subscription not found' });
        
        const newStatus = !sub[0].is_active;
        await db.execute('UPDATE subscriptions SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
        
        res.json({ message: 'Subscription status updated', is_active: newStatus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DELETE PROPERTY ───
router.delete('/properties/:id', adminAuth, async (req, res) => {
    try {
        await db.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── MANAGE SUBSCRIPTION PLANS ───
router.get('/plans', adminAuth, async (req, res) => {
    try {
        const [plans] = await db.execute('SELECT * FROM subscription_plans ORDER BY price ASC');
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/plans', adminAuth, async (req, res) => {
    try {
        const { name, price, duration_days, description } = req.body;
        await db.execute(
            'INSERT INTO subscription_plans (name, price, duration_days, description) VALUES (?, ?, ?, ?)',
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
        await db.execute(
            'UPDATE subscription_plans SET name=?, price=?, duration_days=?, description=? WHERE id=?',
            [name, price, duration_days, description, req.params.id]
        );
        res.json({ message: 'Plan updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/plans/:id/toggle', adminAuth, async (req, res) => {
    try {
        const [plan] = await db.execute('SELECT is_active FROM subscription_plans WHERE id = ?', [req.params.id]);
        if (plan.length === 0) return res.status(404).json({ message: 'Plan not found' });
        
        const newStatus = !plan[0].is_active;
        await db.execute('UPDATE subscription_plans SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
        
        res.json({ message: `Plan ${newStatus ? 'enabled' : 'disabled'} successfully`, is_active: newStatus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// ─── RESET ALL DATA (Admin Only) ───
// DELETE /api/admin/reset-data
// Safely deletes ALL user data while preserving table structure.
router.delete('/reset-data', adminAuth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Disable FK checks to avoid dependency errors
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 2. Delete in safe dependency order (children → parents)
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
                const [result] = await connection.execute(`DELETE FROM ${table}`);
                results[table] = result.affectedRows;
            } catch (err) {
                // Table might not exist — skip silently
                results[table] = `skipped (${err.code || 'not found'})`;
            }
        }

        // 3. Reset auto-increment counters
        for (const table of tables) {
            try {
                await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
            } catch (err) {
                // Ignore if table doesn't exist
            }
        }

        // 4. Re-enable FK checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        await connection.commit();

        console.log('🗑️  Database reset completed:', results);
        res.json({
            message: '✅ All data deleted successfully. Database is clean.',
            deleted: results
        });
    } catch (error) {
        await connection.rollback();
        // Make sure FK checks are re-enabled even on error
        try { await connection.execute('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
        console.error('Reset Error:', error);
        res.status(500).json({ message: 'Reset failed: ' + error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
