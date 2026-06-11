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
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5174',
    'https://smart-room-finder.vercel.app',
];

if (process.env.FRONTEND_URL) {
    const formattedUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(formattedUrl)) {
        allowedOrigins.push(formattedUrl);
    }
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server calls (no origin) and health checks
        if (!origin) return callback(null, true);
        const sanitizedOrigin = origin.replace(/\/$/, '');
        const isAllowed = allowedOrigins.some(o => o.replace(/\/$/, '') === sanitizedOrigin);
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn('[CORS] Blocked origin:', origin);
            callback(new Error('CORS policy: Origin not allowed'), false);
        }
    },
    credentials: true,
}));

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Session (required by Passport) ───────────────────────────────────────────
app.use(session({
    secret: process.env.JWT_SECRET || 'session_secret_fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
}));

// ── Passport ──────────────────────────────────────────────────────────────────
const passport = require('./config/googleAuth');
app.use(passport.initialize());

// ── Request Logging (production-ready) ───────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

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
app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Smart Room Finder API is running',
        timestamp: new Date().toISOString(),
    });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`[SERVER] Starting on port ${PORT} — NODE_ENV=${process.env.NODE_ENV || 'development'}`);
    try {
        const pool = require('./config/db');
        const { rows } = await pool.query('SELECT NOW() as now');
        console.log(`[DB] Neon PostgreSQL connected. Server time: ${rows[0].now}`);
        console.log(`[SERVER] ✅ Ready at http://localhost:${PORT}`);
    } catch (err) {
        console.error('[DB] ❌ PostgreSQL connection FAILED:', err.message);
        console.error('[DB] Ensure DATABASE_URL is set correctly in .env');
    }
});
