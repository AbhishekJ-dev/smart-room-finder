const express = require('express');
const passport = require('../config/googleAuth');
const router = express.Router();

// ── Step 1: Redirect user → Google Login page ──────────────────────────────
router.get(
  '/google',
  (req, res, next) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })(req, res, next);
  }
);

// ── Step 2: Google redirects back here with a code ────────────────────────
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(err.message)}`);
      }
      if (!user) {
        return res.redirect(`http://localhost:5173/login?error=google_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      if (req.user.newUser) {
        // Redirect to complete registration page with Google data
        const params = new URLSearchParams({
          newUser: 'true',
          email: req.user.email,
          name: req.user.name,
          googleId: req.user.googleId,
          picture: req.user.picture || ''
        });
        return res.redirect(`${frontendUrl}/login-success?${params.toString()}`);
      }

      const { token, user } = req.user;

      // Redirect to frontend with token + user info in URL
      const params = new URLSearchParams({
        token,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      res.redirect(`${frontendUrl}/login-success?${params.toString()}`);
    } catch (err) {
      console.error('❌ Callback error:', err.message);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  }
);

module.exports = router;
