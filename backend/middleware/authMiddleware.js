const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
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

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Admin only' });
        }
    });
};

const verifySuperAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'super_admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Super Admin only' });
        }
    });
};

module.exports = { verifyToken, verifyAdmin, verifySuperAdmin };
