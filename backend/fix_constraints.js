/**
 * fix_constraints.js
 * Run this to update the role check constraint in PostgreSQL.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./config/db');

async function fix() {
    try {
        console.log('🛠️ Updating role check constraint...');
        
        // 1. Drop the old constraint
        await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        
        // 2. Add the new constraint with 'user' included
        await pool.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role IN ('user', 'tenant', 'owner', 'admin', 'super_admin'))
        `);
        
        console.log('✅ Constraint updated successfully. "user" role is now allowed.');
    } catch (err) {
        console.error('❌ Failed to update constraint:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fix();
