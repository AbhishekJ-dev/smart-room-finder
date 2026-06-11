const express = require('express');
const pool = require('../config/db');
const { generateOTP, sendOTP } = require('../utils/otpService');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ── Auth middleware ───────────────────────────────────────────────────────────
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

// ── POST /api/owner/send-otp ──────────────────────────────────────────────────
router.post('/send-otp', auth, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owners can verify their email via this endpoint.' });
        }

        const { rows: users } = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

        const email = users[0].email;
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Use otp_code column (standardized)
        await pool.query(
            'UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE id = $3',
            [otp, expiry, req.user.id]
        );

        const sent = await sendOTP(email, otp, 'verification');
        if (!sent) return res.status(500).json({ message: 'Failed to deliver verification email.' });

        res.json({ message: 'OTP sent to your email address.' });
    } catch (error) {
        console.error('[owner/send-otp] Error:', error.message);
        res.status(500).json({ message: 'Server error while sending owner OTP.' });
    }
});

// ── POST /api/owner/verify-otp ────────────────────────────────────────────────
router.post('/verify-otp', auth, async (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP is required.' });

    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owners can verify their email via this endpoint.' });
        }

        // Use otp_code column (standardized)
        const { rows: users } = await pool.query(
            'SELECT otp_code, otp_expiry FROM users WHERE id = $1',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

        const user = users[0];
        if (!user.otp_code) return res.status(400).json({ message: 'No OTP requested.' });

        if (new Date() > new Date(user.otp_expiry)) {
            await pool.query('UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE id = $1', [req.user.id]);
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        if (user.otp_code !== String(otp)) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Verify and clear OTP
        await pool.query(
            'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL WHERE id = $1',
            [req.user.id]
        );
        res.json({ message: 'Email verified successfully! You can now post properties.' });
    } catch (error) {
        console.error('[owner/verify-otp] Error:', error.message);
        res.status(500).json({ message: 'Verification failed.' });
    }
});

module.exports = router;
