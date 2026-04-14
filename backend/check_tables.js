const db = require('./config/db');

async function checkTables() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        console.log('Tables in database:', tables);
        
        const [commissions] = await db.query('SHOW TABLES LIKE "commissions"');
        console.log('Commissions table exists:', commissions.length > 0);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkTables();
