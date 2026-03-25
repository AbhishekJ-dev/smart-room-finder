const express = require('express');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
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

// Multer config for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// ─── ADD ROOM (Owner only, minimum 5 photos) ───
router.post('/', auth, upload.array('photos', 10), (req, res) => {
    try {
        if (req.user.role !== 'owner') return res.status(403).json({ message: 'Only room owners can add rooms' });

        if (!req.files || req.files.length < 5) {
            return res.status(400).json({ message: 'Minimum 5 photos are required' });
        }

        const { type, price_daily, price_weekly, price_monthly, price_quarterly, price_yearly, area, location, contact, description } = req.body;

        if (!type || !area || !location || !contact) {
            return res.status(400).json({ message: 'Room type, area, location, and contact are required' });
        }

        const photos = JSON.stringify(req.files.map(f => `/uploads/${f.filename}`));

        const stmt = db.prepare(`INSERT INTO rooms (owner_id, type, price_daily, price_weekly, price_monthly, price_quarterly, price_yearly, area, location, contact, description, photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        const result = stmt.run(req.user.id, type, price_daily || 0, price_weekly || 0, price_monthly || 0, price_quarterly || 0, price_yearly || 0, area, location, contact, description || '', photos);

        res.status(201).json({ message: 'Room added successfully', roomId: result.lastInsertRowid });
    } catch (error) {
        console.error('Add room error:', error);
        res.status(500).json({ message: error.message });
    }
});

// ─── GET ALL ROOMS (for users - with subscription check) ───
router.get('/', (req, res) => {
    try {
        const rooms = db.prepare('SELECT rooms.*, users.name as owner_name FROM rooms JOIN users ON rooms.owner_id = users.id').all();

        const parsed = rooms.map(r => ({
            ...r,
            photos: JSON.parse(r.photos || '[]'),
            is_booked: !!r.is_booked
        }));

        res.json(parsed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET OWNER'S ROOMS ───
router.get('/my-rooms', auth, (req, res) => {
    try {
        const rooms = db.prepare('SELECT * FROM rooms WHERE owner_id = ?').all(req.user.id);
        const parsed = rooms.map(r => ({
            ...r,
            photos: JSON.parse(r.photos || '[]'),
            is_booked: !!r.is_booked
        }));
        res.json(parsed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── UPDATE ROOM ───
router.put('/:id', auth, (req, res) => {
    try {
        const room = db.prepare('SELECT * FROM rooms WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const { type, price_daily, price_weekly, price_monthly, price_quarterly, price_yearly, area, location, contact, description, is_booked } = req.body;

        db.prepare(`UPDATE rooms SET type=?, price_daily=?, price_weekly=?, price_monthly=?, price_quarterly=?, price_yearly=?, area=?, location=?, contact=?, description=?, is_booked=? WHERE id=?`)
          .run(type || room.type, price_daily || room.price_daily, price_weekly || room.price_weekly, price_monthly || room.price_monthly, price_quarterly || room.price_quarterly, price_yearly || room.price_yearly, area || room.area, location || room.location, contact || room.contact, description || room.description, is_booked !== undefined ? is_booked : room.is_booked, req.params.id);

        res.json({ message: 'Room updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DELETE ROOM ───
router.delete('/:id', auth, (req, res) => {
    try {
        const room = db.prepare('SELECT * FROM rooms WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
