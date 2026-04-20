const jwt = require('jsonwebtoken');
const db = require('../config/db');

const checkSubscription = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
        req.user = decoded;

        // ── RULE: Only tenants can subscribe. Owners always bypass this gate.
        if (decoded.role === 'owner' || decoded.role === 'admin') {
            return next();
        }

        if (decoded.role !== 'tenant') {
            return res.status(403).json({ message: 'Access restricted to tenant accounts only.' });
        }

        // ── Verify active subscription from DB (use NOW() for real-time expiry check)
        const [subs] = await db.execute(
            'SELECT * FROM subscriptions WHERE user_id = ? AND is_active = true AND end_date >= NOW() ORDER BY end_date DESC LIMIT 1',
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
