const pool = require('../config/db');

const requireOwnerVerification = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Authentication required' });

        const { rows: users } = await pool.query('SELECT role, is_verified FROM users WHERE id = $1', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];

        // Only enforce for owners. Tenants and Admins bypass this.
        if (user.role === 'owner' && !user.is_verified) {
            console.warn(`[RESTRICTION] Action blocked: Owner (ID: ${userId}) is not verified.`);
            return res.status(403).json({ 
                message: 'Verification Required: Please verify your email first in your profile to perform this action.',
                requiresVerification: true
            });
        }

        next();
    } catch (error) {
        console.error('Owner verification middleware error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = requireOwnerVerification;
