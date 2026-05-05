const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const checkSubscription = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
        req.user = decoded;

        // ── RULE: Owners and admins always bypass this gate.
        if (decoded.role === 'owner' || decoded.role === 'admin') {
            return next();
        }

        // ── Verify active subscription from DB
        const { rows: subs } = await pool.query(
            'SELECT * FROM subscriptions WHERE user_id = $1 AND is_active = true AND end_date >= NOW() ORDER BY end_date DESC LIMIT 1',
            [decoded.id]
        );

        if (subs.length === 0) {
            return res.status(403).json({ message: 'An active subscription is required to access this feature.' });
        }

        req.subscription = subs[0];
        next();
    } catch (err) {
        console.error('Subscription check error:', err);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = checkSubscription;
