const express = require('express');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { upload } = require('../config/cloudinaryConfig');
const requireOwnerVerification = require('../middleware/requireOwnerVerification');
const router = express.Router();

// Auth middleware
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

// ─── ADD ROOM (Owner only, minimum 5 photos) ───
router.post('/', auth, requireOwnerVerification, (req, res, next) => {
    // Run multer first, handle its errors cleanly before entering main logic
    upload.array('photos', 10)(req, res, (err) => {
        if (err) {
            // Multer / Cloudinary / file filter errors
            console.error('[MULTER ERROR]', err.message);
            return res.status(400).json({ message: err.message || 'File upload error.' });
        }
        next();
    });
}, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();

        let { type, price_daily, price_weekly, price_monthly, price_quarterly, price_yearly, area, city, location, contact, description, tenant_type, annualRent } = req.body;

        if (!annualRent || String(annualRent).trim() === '') {
            annualRent = (parseFloat(price_monthly) || 0) * 12;
        }

        // ─── Validation ───────────────────────────────────────────────────
        if (!city || city.trim() === '') {
            return res.status(400).json({ message: 'Validation Error: City is required.' });
        }

        if (!req.files || req.files.length < 5) {
            return res.status(400).json({ message: `Validation Error: At least 5 photos are required. You uploaded ${req.files?.length || 0}.` });
        }

        if (!type || !area || !location || !contact) {
            return res.status(400).json({ message: 'Room type, area, location, and contact are required.' });
        }

        if (parseFloat(annualRent) < 0) {
            return res.status(400).json({ message: 'Annual rent cannot be negative.' });
        }

        await connection.beginTransaction();

        // ─── 1. Insert room ───────────────────────────────────────────────
        const [result] = await connection.execute(
            `INSERT INTO rooms (
                owner_id, type, price_daily, price_weekly, price_monthly, 
                price_quarterly, price_yearly, area, city, location, 
                contact, description, annual_rent, tenant_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, type, price_daily || 0, price_weekly || 0, price_monthly || 0,
                price_quarterly || 0, price_yearly || 0, area, city, location,
                contact, description || '', annualRent || 0, tenant_type || 'Anyone'
            ]
        );
        const roomId = result.insertId;

        // ─── 2. Insert photos from Cloudinary ─────────────────────────────
        for (const file of req.files) {
            // multer-storage-cloudinary stores the secure URL in file.path
            const imageUrl = file.path;

            if (!imageUrl || !imageUrl.startsWith('http')) {
                console.error('[UPLOAD ERROR] Invalid image URL from Cloudinary:', file);
                throw new Error('Cloudinary returned an invalid image URL. Check your credentials.');
            }

            await connection.execute(
                'INSERT INTO room_images (room_id, image_url) VALUES (?, ?)',
                [roomId, imageUrl]
            );
        }

        await connection.commit();
        res.status(201).json({
            message: 'Property added successfully!',
            roomId,
            uploadedPhotos: req.files.length
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('CRITICAL: Add room error:', error.message);
        res.status(500).json({
            message: 'Server Error while adding property.',
            error: error.message,
        });
    } finally {
        if (connection) connection.release();
    }
});

// ─── GET ALL ROOMS (for users) ───
router.get('/', async (req, res) => {
    try {
        let isAuthenticated = false;
        const token = req.headers.authorization?.split(' ')[1];
        if (token && token !== 'null' && token !== 'undefined') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
                isAuthenticated = true;
                req.userId = decoded.id;
            } catch (err) {}
        }

        const [rooms] = await db.execute(`
            SELECT r.*, u.name as owner_name, 
                   IFNULL(
                       (SELECT GROUP_CONCAT(image_url) FROM room_images WHERE room_id = r.id),
                       ''
                   ) as photos,
                   EXISTS (SELECT 1 FROM bookings b WHERE b.room_id = r.id AND b.status = 'pending') as has_pending
            FROM rooms r 
            JOIN users u ON r.owner_id = u.id
            ORDER BY r.created_at DESC
        `);

        // Mask sensitive data:
        // 1. Hide for unauthenticated visitors
        // 2. Hide for authenticated users WITHOUT an active subscription
        const processedRooms = await Promise.all(rooms.map(async (r) => {
            let photos = r.photos;
            if (typeof photos === 'string') {
                if (photos.startsWith('[')) {
                    try { photos = JSON.parse(photos); } catch (e) { photos = []; }
                } else {
                    photos = photos ? photos.split(',') : [];
                }
            } else if (!Array.isArray(photos)) {
                photos = [];
            }
            
            const roomData = { ...r, photos: photos || [], is_booked: !!r.is_booked, has_pending: !!r.has_pending };
            
            let isSubscribed = false;
            if (isAuthenticated) {
                // Verify subscription status from DB
                const [subs] = await db.execute(
                    'SELECT id FROM subscriptions WHERE user_id = ? AND is_active = true AND end_date >= NOW() LIMIT 1',
                    [req.userId] // Wait, I need to make sure userId is set. roomRoutes uses req.user from auth.
                );
                isSubscribed = subs.length > 0;
            }

            // Mask if not authenticated OR not subscribed
            if (!isAuthenticated || !isSubscribed) {
                roomData.contact = null;
                roomData.location = null;
                roomData.is_locked = true; // Add a flag for frontend
            } else {
                roomData.is_locked = false;
            }

            return roomData;
        }));

        res.json(processedRooms);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch rooms.' });
    }
});

// ─── GET OWNER'S ROOMS ───
router.get('/my-rooms', auth, async (req, res) => {
    try {
        const [rooms] = await db.execute(`
            SELECT r.*, 
                   IFNULL(
                       (SELECT GROUP_CONCAT(image_url) FROM room_images WHERE room_id = r.id),
                       ''
                   ) as photos,
                   EXISTS (SELECT 1 FROM bookings b WHERE b.room_id = r.id AND b.status = 'pending') as has_pending
            FROM rooms r
            WHERE r.owner_id = ?
            ORDER BY r.created_at DESC
        `, [req.user.id]);
        
        res.json(rooms.map(r => {
            let photos = r.photos;
            if (typeof photos === 'string') {
                if (photos.startsWith('[')) {
                    try { photos = JSON.parse(photos); } catch (e) { photos = []; }
                } else {
                    photos = photos ? photos.split(',') : [];
                }
            } else if (!Array.isArray(photos)) {
                photos = [];
            }
            return { ...r, photos: photos || [], is_booked: !!r.is_booked, has_pending: !!r.has_pending };
        }));
    } catch (error) {
        console.error('Get my-rooms error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch your properties.' });
    }
});

// ─── UPDATE ROOM ───
router.put('/:id', auth, requireOwnerVerification, async (req, res) => {
    try {
        const [rooms] = await db.execute('SELECT * FROM rooms WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
        if (rooms.length === 0) return res.status(404).json({ message: 'Room not found' });

        const room = rooms[0];
        const { type, price_daily, price_weekly, price_monthly, price_quarterly, price_yearly, area, location, city, contact, description, is_booked, tenant_type, annualRent } = req.body;

        await db.execute(
            `UPDATE rooms SET type=?, price_daily=?, price_weekly=?, price_monthly=?, price_quarterly=?, price_yearly=?, annual_rent=?, area=?, location=?, city=?, contact=?, description=?, is_booked=?, tenant_type=? WHERE id=?`,
            [
                type || room.type, 
                price_daily || room.price_daily, 
                price_weekly || room.price_weekly, 
                price_monthly || room.price_monthly, 
                price_quarterly || room.price_quarterly, 
                price_yearly || room.price_yearly, 
                annualRent !== undefined ? annualRent : room.annual_rent,
                area || room.area, 
                location || room.location, 
                city !== undefined ? city : room.city,
                contact || room.contact, 
                description || room.description, 
                is_booked !== undefined ? is_booked : room.is_booked, 
                tenant_type || room.tenant_type || 'Anyone',
                req.params.id
            ]
        );

        res.json({ message: 'Room updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DELETE ROOM ───
router.delete('/:id', auth, requireOwnerVerification, async (req, res) => {
    try {
        const [rooms] = await db.execute('SELECT * FROM rooms WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
        if (rooms.length === 0) return res.status(404).json({ message: 'Room not found' });

        await db.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
