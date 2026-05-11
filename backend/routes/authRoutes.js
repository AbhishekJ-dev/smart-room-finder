const express = require('express');
const { register, login, getProfile, completeGoogleRegistration, forgotPassword, verifyResetOTP, resetPassword, changePassword } = require('../controllers/authController');
const { validatePassword } = require('../middleware/passwordValidation');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to protect routes that require authentication
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized to access this route' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

router.post('/register', validatePassword, register);
router.post('/login', login);
router.post('/complete-google-registration', completeGoogleRegistration);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', validatePassword, resetPassword);
router.post('/change-password', protect, validatePassword, changePassword);
router.get('/profile/:id', getProfile);
router.get('/:id', getProfile); // Adding GET /api/users/:id alias as requested

module.exports = router;
