const jwt = require('jsonwebtoken');
const db = require('../config/db');

const checkSubscription = async (req, res, next) => {
    // Requires a token, just like auth middleware, but we can assume auth runs first
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
        req.user = decoded;

        // Verify user subscription from DB
        const [subs] = await db.execute(
            'SELECT * FROM subscriptions WHERE user_id = ? AND is_active = true AND end_date >= CURDATE() ORDER BY end_date DESC LIMIT 1',
            [decoded.id]
        );

        if (subs.length === 0) {
            return res.status(403).json({ message: 'Please subscribe to unlock this feature' });
        }

        req.subscription = subs[0];
        next();
    } catch (err) {
        console.error('Subscription check error:', err);
        return res.status(401).json({ message: 'Invalid token or subscription' });
    }
};

module.exports = checkSubscription;
