const express = require('express');
const pool = require('../config/db');
const { generateOTP, sendOTP } = require('../utils/otpService');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id — Get profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { rows: users } = await pool.query(
            'SELECT id, name, email, role, is_verified FROM users WHERE id = $1',
            [req.params.id]
        );
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Failed to fetch user data' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/:id/name — Update display name
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/name', async (req, res) => {
    const { name } = req.body;
    if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }
    try {
        const { rows: result } = await pool.query(
            'UPDATE users SET name = $1 WHERE id = $2',
            [String(name).trim(), req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'User not found.' });
        res.json({ message: 'Name updated successfully.' });
    } catch (error) {
        console.error('Update name error:', error);
        res.status(500).json({ message: 'Failed to update name.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/send-otp — Send OTP to current email
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/send-verify-otp', async (req, res) => {
    try {
        const { rows: users } = await pool.query('SELECT email FROM users WHERE id = $1', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

        const email = users[0].email;
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await pool.query('UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE id = $3', [otp, expiry, req.params.id]);
        const sent = await sendOTP(email, otp, 'verification');
        if (!sent) return res.status(500).json({ message: 'Failed to deliver OTP email. Please check your email configuration.' });

        res.json({ message: 'OTP sent to your email address.' });
    } catch (error) {
        console.error('Send OTP Error [STK]:', error);
        res.status(500).json({ message: 'Internal server error while sending OTP.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/verify-otp — Verify OTP and mark account verified
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/confirm-verify', async (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP is required.' });

    try {
        const { rows: users } = await pool.query('SELECT otp_code, otp_expiry FROM users WHERE id = $1', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

        const user = users[0];
        if (!user.otp_code) return res.status(400).json({ message: 'No OTP requested.' });
        
        if (new Date() > new Date(user.otp_expiry)) {
            await pool.query('UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE id = $1', [req.params.id]);
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        if (user.otp_code !== String(otp)) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Set verified, and clear OTP fields to prevent reuse
        await pool.query('UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL WHERE id = $1', [req.params.id]);
        res.json({ message: 'Account verified successfully! Your account is now active.' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Verification failed.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/:id/send-email-otp — Step 1: Update email immediately and send OTP
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/send-email-otp', async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: 'New email is required.' });

    try {
        // Check if email already taken
        const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, req.params.id]);
        if (existing.length > 0) return res.status(400).json({ message: 'This email address is already in use.' });

        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        // Security Rule: Update email instantly, set verified = false
        await pool.query('UPDATE users SET email = $1, is_verified = FALSE, otp_code = $2, otp_expiry = $3 WHERE id = $4', 
            [newEmail, otp, expiry, req.params.id]);

        const sent = await sendOTP(newEmail, otp, 'change');
        if (!sent) return res.status(500).json({ message: 'Failed to deliver OTP to the new email. Verification aborted.' });

        res.json({ message: 'Email updated. OTP sent to your new address for verification.' });
    } catch (error) {
        console.error('Send Change OTP Error [STK]:', error);
        res.status(500).json({ message: 'Internal server error while processing email change.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/:id/update-email — Step 2: Verify OTP and finalize verification
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/update-email', async (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP is required.' });

    try {
        const { rows: users } = await pool.query('SELECT otp_code, otp_expiry FROM users WHERE id = $1', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found.' });
        
        const user = users[0];
        if (!user.otp_code) return res.status(400).json({ message: 'No verification requested.' });
        
        if (new Date() > new Date(user.otp_expiry)) {
            await pool.query('UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE id = $1', [req.params.id]);
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        if (user.otp_code !== String(otp)) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Finalize: Set is_verified = TRUE and clear OTP fields
        await pool.query(
            'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL WHERE id = $1', 
            [req.params.id]
        );
        res.json({ message: 'Email updated and verified successfully! Your account is now fully active.' });
    } catch (error) {
        console.error('Update email error:', error);
        res.status(500).json({ message: 'Failed to verify email.' });
    }
});

module.exports = router;
