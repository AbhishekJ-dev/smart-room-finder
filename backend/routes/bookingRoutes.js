const express = require('express');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const requireOwnerVerification = require('../middleware/requireOwnerVerification');
const notificationService = require('../utils/notificationService');
const router = express.Router();

// Auth middleware (can be extracted to middleware folder later)
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const adminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }
        next();
    });
};

const ownerOrAdminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied: Admin or Owner only' });
        }
        next();
    });
};

// ─── USER CREATES BOOKING (Status = PENDING) ───
router.post('/', auth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        if (req.user.role === 'owner') return res.status(403).json({ message: 'Owners cannot book rooms' });

        const { room_id, duration, total_price, start_date, end_date } = req.body;
        if (!room_id || !duration) return res.status(400).json({ message: 'Room ID and duration are required' });

        // 1. Subscription Check (Protect Booking Feature)
        const [subs] = await db.execute(
            'SELECT id FROM subscriptions WHERE user_id = ? AND is_active = true AND end_date >= NOW() LIMIT 1',
            [req.user.id]
        );
        if (subs.length === 0) {
            return res.status(403).json({ 
                message: 'Booking Locked: You must have an active subscription to book rooms. Please upgrade your plan.',
                needsSubscription: true 
            });
        }

        await connection.beginTransaction();

        // Check if room is already booked
        const [rooms] = await connection.execute('SELECT * FROM rooms WHERE id = ? FOR UPDATE', [room_id]);
        if (rooms.length === 0) throw new Error('Room not found');
        if (rooms[0].is_booked) throw new Error('Room is already booked');

        // Check if room already has a pending booking request
        const [pendingBookings] = await connection.execute('SELECT * FROM bookings WHERE room_id = ? AND status = "pending"', [room_id]);
        if (pendingBookings.length > 0) throw new Error('Room is already pending approval for a booking request');

        const room = rooms[0];
        const finalPrice = total_price || room.price_monthly || 0;

        // Insert booking (pending)
        const [result] = await connection.execute(
            `INSERT INTO bookings (user_id, room_id, duration, start_date, end_date, total_price, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [req.user.id, room_id, duration, start_date || null, end_date || null, finalPrice]
        );

        await connection.commit();

        // ─── SEND NOTIFICATION TO OWNER ───
        try {
            const [[owner]] = await db.execute(
                'SELECT u.id, u.email FROM users u JOIN rooms r ON r.owner_id = u.id WHERE r.id = ?', 
                [room_id]
            );
            const [[tenant]] = await db.execute('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
            
            if (owner && tenant) {
                notificationService.sendBookingAlertToOwner(owner.id, owner.email, tenant.email, tenant.name, room);
            }
        } catch (mailError) {
            console.error('Owner notification error:', mailError);
        }

        res.status(201).json({ message: 'Booking request successful! Status: Pending Approval', bookingId: result.insertId });
    } catch (error) {
        await connection.rollback();
        console.error('Booking error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// ─── GET MY BOOKINGS (For Users) ───
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const [bookings] = await db.execute(`
            SELECT b.*, r.type as title, r.price_monthly as price, r.area,
            (SELECT image_url FROM room_images WHERE room_id = r.id LIMIT 1) as image
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC
        `, [req.user.id]);
        res.json(bookings);
    } catch (error) {
        console.error('Get my-bookings error:', error);
        res.status(500).json({ message: error.message });
    }
});


// ─── GET USER BOOKINGS BY ID (For specific data fetch) ───
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const [bookings] = await db.execute(`
            SELECT 
                b.id as booking_id,
                b.status,
                b.duration,
                b.total_price,
                r.id as room_id,
                r.type as title,
                r.price_monthly as price,
                r.area,
                (SELECT image_url FROM room_images WHERE room_id = r.id LIMIT 1) as image
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC
        `, [userId]);
        res.json(bookings);
    } catch (error) {
        console.error('Get user-bookings error:', error);
        res.status(500).json({ message: error.message });
    }
});



// ─── ADMIN CONFIRMS BOOKING (Generates Commission for Owner) ───
router.put('/:id/confirm', adminAuth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check booking exists and is pending
        const [bookings] = await connection.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [req.params.id]);
        if (bookings.length === 0) throw new Error('Booking not found');
        
        const booking = bookings[0];
        if (booking.status !== 'pending') throw new Error('Booking is not pending');

        // Confirm booking
        await connection.execute('UPDATE bookings SET status = "confirmed" WHERE id = ?', [booking.id]);

        // Find room owner to bill the commission
        const [rooms] = await connection.execute('SELECT owner_id FROM rooms WHERE id = ?', [booking.room_id]);
        const owner_id = rooms[0].owner_id;

        // Commission logic (e.g. 5% of total price) -> owner pays it, initially status is pending
        const commissionAmount = booking.total_price * 0.05;

        // Due date calculation (7 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        await connection.execute(
            `INSERT INTO commissions (booking_id, owner_id, amount, status, due_date) VALUES (?, ?, ?, 'pending', ?)`,
            [booking.id, owner_id, commissionAmount, dueDate]
        );

        await connection.commit();

        // ─── SEND NOTIFICATION TO TENANT ───
        try {
            const [[tenant]] = await db.execute('SELECT name, email FROM users WHERE id = ?', [booking.user_id]);
            const [[room]] = await db.execute('SELECT type, area, city FROM rooms WHERE id = ?', [booking.room_id]);
            if (tenant && room) {
                notificationService.sendBookingStatusUpdateToTenant(booking.user_id, tenant.email, tenant.name, room, 'confirmed');
            }
        } catch (mailError) {
            console.error('Tenant notification error:', mailError);
        }

        res.json({ message: 'Booking confirmed and commission generated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Admin confirmation error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// ─── OWNER OR ADMIN UPDATES BOOKING STATUS ───
router.put('/:id/status', ownerOrAdminAuth, requireOwnerVerification, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { status } = req.body;
        if (!['confirmed', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await connection.beginTransaction();

        const [bookings] = await connection.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [req.params.id]);
        if (bookings.length === 0) throw new Error('Booking not found');
        const booking = bookings[0];

        // If user is owner, verify they own the room
        if (req.user.role === 'owner') {
            const [rooms] = await connection.execute('SELECT owner_id FROM rooms WHERE id = ?', [booking.room_id]);
            if (rooms.length === 0 || rooms[0].owner_id !== req.user.id) {
                throw new Error('Access denied: You do not own this room');
            }
        }

        if (status === 'rejected') {
            await connection.execute('UPDATE bookings SET status = "rejected" WHERE id = ?', [booking.id]);
            // Revert room status to available
            await connection.execute('UPDATE rooms SET is_booked = 0 WHERE id = ?', [booking.room_id]);
        } else if (status === 'confirmed') {
            if (booking.status !== 'pending') throw new Error('Booking is not pending');
            await connection.execute('UPDATE bookings SET status = "confirmed" WHERE id = ?', [booking.id]);
            
            // Mark the room as booked now
            await connection.execute('UPDATE rooms SET is_booked = 1 WHERE id = ?', [booking.room_id]);
            
            // Find room owner to bill the commission
            const [rooms] = await connection.execute('SELECT owner_id FROM rooms WHERE id = ?', [booking.room_id]);
            const commissionAmount = booking.total_price * 0.05;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            await connection.execute(
                `INSERT INTO commissions (booking_id, owner_id, amount, status, due_date) VALUES (?, ?, ?, 'pending', ?)`,
                [booking.id, rooms[0].owner_id, commissionAmount, dueDate]
            );
        } else if (status === 'completed') {
            await connection.execute('UPDATE bookings SET status = "completed" WHERE id = ?', [booking.id]);
            // Free up the room again
            await connection.execute('UPDATE rooms SET is_booked = 0 WHERE id = ?', [booking.room_id]);
        }

        await connection.commit();

        // ─── SEND NOTIFICATION TO TENANT ───
        try {
            if (status === 'confirmed' || status === 'rejected') {
                const [[tenant]] = await db.execute('SELECT name, email FROM users WHERE id = ?', [booking.user_id]);
                const [[room]] = await db.execute('SELECT type, area, city FROM rooms WHERE id = ?', [booking.room_id]);
                
                if (tenant && room) {
                    notificationService.sendBookingStatusUpdateToTenant(booking.user_id, tenant.email, tenant.name, room, status);
                }
            }
        } catch (mailError) {
            console.error('Tenant notification error:', mailError);
        }

        res.json({ message: `Booking status updated to ${status}` });
    } catch (error) {
        await connection.rollback();
        console.error('Update status error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// ─── GET OWNER'S BOOKINGS (For Owners to see who's booking their rooms) ───
router.get('/owner', auth, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied: Owners only' });
        }

        const [bookings] = await db.execute(`
            SELECT b.*, u.name as user_name, r.type as room_type, r.area as room_area
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            WHERE r.owner_id = ?
            ORDER BY b.booking_date DESC
        `, [req.user.id]);
        
        res.json(bookings);
    } catch (error) {
        console.error('Owner booking fetch error:', error);
        res.status(500).json({ message: error.message });
    }
});

// ─── USER SUBMITS RATING ───
router.put('/:id/rate', auth, async (req, res) => {
    try {
        const { rating } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const [result] = await db.execute(
            'UPDATE bookings SET rating = ? WHERE id = ? AND user_id = ?',
            [rating, req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking not found or already rated' });
        }

        res.json({ message: 'Thank you for your rating!' });
    } catch (error) {
        console.error('Rating error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

