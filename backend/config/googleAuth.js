const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const db = require('./db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const name = profile.displayName || profile.name?.givenName || 'Google User';
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        // 1. Check if user already exists (by email OR google_id)
        const [rows] = await db.execute(
          'SELECT * FROM users WHERE email = ? OR google_id = ? LIMIT 1',
          [email, googleId]
        );

        let user;

        if (rows.length > 0) {
          user = rows[0];

          // Update google_id if not set yet (existing email user signs in with Google)
          if (!user.google_id) {
            await db.execute('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
            user.google_id = googleId;
          }

          // Generate JWT using the role stored in the database
          const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
          );

          return done(null, { user, token });
        } else {
          // 2. New user → Return flag and profile data to callback for front-end redirection
          return done(null, { 
            newUser: true, 
            googleId, 
            name, 
            email,
            picture: profile.photos?.[0]?.value
          });
        }
      } catch (err) {
        console.error('❌ Google OAuth error:', err.message);
        return done(err, null);
      }
    }
  )
);

// Minimal serialization (we use JWT, not sessions, but passport requires these)
passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));

module.exports = passport;
