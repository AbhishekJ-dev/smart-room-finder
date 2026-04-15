require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const googleRoutes = require('./routes/googleRoutes');
const statsRoutes = require('./routes/statsRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://127.0.0.1:5174', 
  'http://localhost:5174',
  'https://smart-room-finder.vercel.app'
];

if (process.env.FRONTEND_URL) {
  // Add env-defined URL after removing any trailing slash for consistency
  const formattedUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
  if (!allowedOrigins.includes(formattedUrl)) {
    allowedOrigins.push(formattedUrl);
  }
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin (ignoring trailing slashes)
    const sanitizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(o => o.replace(/\/$/, '') === sanitizedOrigin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      callback(new Error(msg), false);
    }
  },
  credentials: true,
}));

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Session (required by Passport, even when using JWT) ───────────────────────
app.use(session({
  secret: process.env.JWT_SECRET || 'session_secret_fallback',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // set true in production with HTTPS
}));

// ── Passport ──────────────────────────────────────────────────────────────────
const passport = require('./config/googleAuth');
app.use(passport.initialize());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Google OAuth Routes ───────────────────────────────────────────────────────
app.use('/auth', googleRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Smart Room Finder API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
