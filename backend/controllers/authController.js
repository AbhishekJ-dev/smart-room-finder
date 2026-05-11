const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTP } = require('../utils/otpService');
const notificationService = require('../utils/notificationService');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User with this email does not exist' });

        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await pool.query(
            'UPDATE users SET reset_otp = $1, otp_expiry = $2 WHERE email = $3',
            [otp, expiry, email]
        );

        const emailSent = await sendOTP(email, otp, 'reset');
        if (!emailSent) return res.status(500).json({ message: 'Failed to send OTP email' });

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND reset_otp = $2',
            [email, otp]
        );

        if (users.length === 0) return res.status(400).json({ message: 'Invalid OTP' });

        const user = users[0];
        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: 'OTP expired, resend' });
        }

        res.json({ message: 'OTP verified' });
    } catch (error) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password = $1, reset_otp = NULL, otp_expiry = NULL WHERE email = $2',
            [hashedPassword, email]
        );

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.length > 0) {
            const existingUser = existing[0];
            if (existingUser.role !== role) {
                return res.status(400).json({ message: `This email address is already registered as a ${existingUser.role}. Please log in with the correct role.` });
            } else {
                return res.status(400).json({ message: 'This email address is already in use. Please try a different email address.' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user using transaction to ensure data integrity
        const client = await pool.connect();
        await client.query('BEGIN');

        try {
            const { rows: result } = await client.query(
                'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, false) RETURNING id',
                [name, email, hashedPassword, role]
            );

            const newUserId = result[0].id;

            // Link generic profiles based on role
            if (role === 'owner') {
                await client.query('INSERT INTO owners (user_id) VALUES ($1)', [newUserId]);
            } else if (role === 'admin') {
                await client.query('INSERT INTO admins (user_id) VALUES ($1)', [newUserId]);
            }

            await client.query('COMMIT');
            res.status(201).json({ message: 'Registration successful! Please login.' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'smart_room_finder_secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                is_verified: !!user.is_verified 
            }
        });

        // Trigger login notification asynchronously
        notificationService.sendLoginNotification(user).catch(err => console.error('Login email error:', err));
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.completeGoogleRegistration = async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, email, role, googleId } = req.body;

        if (!name || !email || !role || !googleId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists (fail-safe)
        const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        await client.query('BEGIN');

        // 1. Insert user
        const { rows: result } = await client.query(
            'INSERT INTO users (google_id, name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5, true) RETURNING id',
            [googleId, name, email, '', role]
        );

        const newUserId = result[0].id;

        // 2. Link generic profiles based on role
        if (role === 'owner') {
            await client.query('INSERT INTO owners (user_id) VALUES ($1)', [newUserId]);
        } else if (role === 'admin') {
            await client.query('INSERT INTO admins (user_id) VALUES ($1)', [newUserId]);
        }

        await client.query('COMMIT');

        // 3. Generate token
        const token = jwt.sign(
            { id: newUserId, role: role },
            process.env.JWT_SECRET || 'smart_room_finder_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUserId,
                name,
                email,
                role,
                is_verified: true
            }
        });

        // Trigger login notification for Google users
        notificationService.sendLoginNotification({ name, email }).catch(err => console.error('Login email error:', err));

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Complete Google registration error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        client.release();
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows: users } = await pool.query('SELECT id, name, email, role, is_verified FROM users WHERE id = $1', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        res.json({
            ...user,
            is_verified: !!user.is_verified
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { id } = req.user; // Assuming req.user is set by auth middleware
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }

        const { rows: users } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];

        // If the user registered via Google, they might not have a password set initially
        // but if they try to change it, let's just make sure they provided the correct current password
        // if they had one, or prevent changing if they don't have one and we enforce currentPassword
        if (user.password) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
        } else {
            return res.status(400).json({ message: 'Google accounts cannot change password via this method.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, id]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: error.message });
    }
};

