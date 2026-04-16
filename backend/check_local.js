const mysql = require('mysql2/promise');

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root123',
            database: 'smart_room_finder'
        });
        
        const [tables] = await conn.execute('SHOW TABLES');
        console.log('--- Local Database Tables ---');
        for (const t of tables) {
            const tableName = Object.values(t)[0];
            const [rows] = await conn.execute(`SELECT COUNT(*) as c FROM \`${tableName}\``);
            console.log(`${tableName}: ${rows[0].c} rows`);
        }
        await conn.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
