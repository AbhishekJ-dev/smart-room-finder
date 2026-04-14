const express = require('express');
const { register, login, getProfile, completeGoogleRegistration, forgotPassword, verifyResetOTP, resetPassword } = require('../controllers/authController');
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/complete-google-registration', completeGoogleRegistration);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.get('/profile/:id', getProfile);
router.get('/:id', getProfile); // Adding GET /api/users/:id alias as requested

module.exports = router;
