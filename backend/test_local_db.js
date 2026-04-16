const mysql = require('mysql2/promise');

(async () => {
    const passwords = ['', 'password', 'root123', 'root'];
    let connected = false;

    for (const pass of passwords) {
        try {
            const conn = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pass,
                database: 'smart_room_finder'
            });
            console.log(`Connected successfully with password: "${pass}"`);
            await conn.end();
            connected = true;
            break;
        } catch (e) {
            console.log(`Failed with password "${pass}":`, e.message);
        }
    }

    if (!connected) {
        console.log('Failed to connect to local database with all test passwords.');
    }
})();
