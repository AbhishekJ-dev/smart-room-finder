const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET /api/stats
router.get('/', async (req, res) => {
    try {
        // COUNT bookings WHERE rating >= 3
        const { rows: happyTenantsResult } = await pool.query(
            'SELECT COUNT(*)::INT as count FROM bookings WHERE rating >= 3'
        );
        
        // COUNT properties WHERE is_deleted = false
        const { rows: liveListingsResult } = await pool.query(
            'SELECT COUNT(*)::INT as count FROM rooms WHERE is_deleted = false'
        );
        
        // AVG rating from bookings
        const { rows: avgRatingResult } = await pool.query(
            'SELECT AVG(rating) as avg FROM bookings WHERE rating > 0'
        );

        res.json({
            happyTenants: happyTenantsResult[0].count,
            liveListings: liveListingsResult[0].count,
            avgRating: parseFloat(avgRatingResult[0].avg || 0).toFixed(1)
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

module.exports = router;
