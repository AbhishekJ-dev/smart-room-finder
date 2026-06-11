const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { verifyAdmin: adminAuth, verifySuperAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// ─── ADMIN DASHBOARD STATISTICS ───
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const [usersRes, propertiesRes, bookingsRes, subsRes, revenueRes] = await Promise.all([
            pool.query("SELECT COUNT(*)::INT as count FROM users WHERE role NOT IN ('admin', 'super_admin') AND (is_deleted = false OR is_deleted IS NULL)"),
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
            `SELECT 'user' as type, CONCAT(name, ' joined as ', role) as message, 'New User' as badge, 'purple' as color, created_at FROM users WHERE role NOT IN ('admin', 'super_admin') AND (is_deleted = false OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 3`
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
            "SELECT id, name, email, role, created_at FROM users WHERE role NOT IN ('admin', 'super_admin') AND (is_deleted = false OR is_deleted IS NULL) ORDER BY created_at DESC"
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
            WHERE u.role = 'owner' AND (u.is_deleted = false OR u.is_deleted IS NULL)
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
            WHERE r.owner_id = $1 AND (u.is_deleted = false OR u.is_deleted IS NULL) AND r.is_deleted = false
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
            WHERE (u.is_deleted = false OR u.is_deleted IS NULL) AND r.is_deleted = false
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
            WHERE (u.is_deleted = false OR u.is_deleted IS NULL) AND (o.is_deleted = false OR o.is_deleted IS NULL)
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
        const result = await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── SOFT DELETE USER ───
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            "UPDATE users SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND role NOT IN ('admin', 'super_admin')",
            [req.params.id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ message: 'User not found or cannot be deleted via this route' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── RESTORE DELETED USER (Optional/Scalability) ───
router.patch('/users/:id/restore', adminAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            "UPDATE users SET is_deleted = false, deleted_at = NULL WHERE id = $1 AND role NOT IN ('admin', 'super_admin')",
            [req.params.id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User restored successfully' });
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
            WHERE (u.is_deleted = false OR u.is_deleted IS NULL)
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

router.delete('/plans/:id', adminAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        const planId = req.params.id;
        
        // Check if there are any ACTIVE subscriptions associated with this plan
        const { rows: activeSubs } = await client.query('SELECT id FROM subscriptions WHERE plan_id = $1 AND is_active = true LIMIT 1', [planId]);
        if (activeSubs.length > 0) {
            return res.status(400).json({ message: 'Cannot delete plan because it is being used by ACTIVE subscriptions. Please wait for them to expire or disable the plan instead.' });
        }
        
        await client.query('BEGIN');
        
        // Delete inactive subscriptions associated with this plan to satisfy foreign key constraints
        await client.query('DELETE FROM subscriptions WHERE plan_id = $1', [planId]);
        
        // Delete the plan
        const { rowCount } = await client.query('DELETE FROM subscription_plans WHERE id = $1', [planId]);
        
        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Plan not found' });
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete plan error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        client.release();
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

// ─── ADMIN MANAGEMENT (SUPER ADMIN ONLY) ───
// List all admins
router.get('/admins', verifySuperAdmin, async (req, res) => {
    try {
        const { rows: admins } = await pool.query(
            "SELECT id, name, email, role, created_at FROM users WHERE role IN ('admin', 'super_admin') ORDER BY created_at DESC"
        );
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new admin
router.post('/admins', verifySuperAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        if (role && !['admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const { rows: existingUser } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const assignedRole = role || 'admin';

        const { rows: newUser } = await pool.query(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING id, name, email, role, created_at',
            [name, email, hashedPassword, assignedRole]
        );
        
        await pool.query('INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [newUser[0].id]);

        res.status(201).json(newUser[0]);
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ message: error.message });
    }
});

// Remove an admin
router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const targetId = parseInt(req.params.id);
        const requestorId = req.user.id;

        if (targetId === requestorId) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const { rows: targetUser } = await client.query('SELECT role FROM users WHERE id = $1', [targetId]);
        if (targetUser.length === 0) return res.status(404).json({ message: 'Admin not found' });
        
        if (targetUser[0].role === 'super_admin') {
            const { rows: superAdmins } = await client.query("SELECT COUNT(*)::INT as count FROM users WHERE role = 'super_admin'");
            if (superAdmins[0].count <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last super admin' });
            }
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM admins WHERE user_id = $1', [targetId]);
        await client.query('DELETE FROM users WHERE id = $1', [targetId]);
        await client.query('COMMIT');

        res.json({ message: 'Admin removed successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error removing admin:', error);
        res.status(500).json({ message: error.message });
    } finally {
        client.release();
    }
});

// Change admin role
router.patch('/admins/:id/role', verifySuperAdmin, async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        const { role } = req.body;
        const requestorId = req.user.id;

        if (!['admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        if (targetId === requestorId) {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }

        const { rows: targetUser } = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
        if (targetUser.length === 0) return res.status(404).json({ message: 'Admin not found' });

        if (targetUser[0].role === 'super_admin' && role === 'admin') {
            const { rows: superAdmins } = await pool.query("SELECT COUNT(*)::INT as count FROM users WHERE role = 'super_admin'");
            if (superAdmins[0].count <= 1) {
                return res.status(400).json({ message: 'Cannot demote the last super admin' });
            }
        }

        const { rows: updated } = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role', [role, targetId]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating admin role:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
