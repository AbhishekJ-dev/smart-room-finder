const db = require('./config/db');

async function test() {
    try {
        console.log('Testing db connection...');
        const [rooms] = await db.execute(`
            SELECT r.*, IFNULL(JSON_ARRAYAGG(ri.image_url), '[]') as photos
            FROM rooms r
            LEFT JOIN room_images ri ON r.id = ri.room_id
            WHERE r.owner_id = ?
            GROUP BY r.id
        `, [1]);
        console.log('Success:', rooms);
    } catch (err) {
        console.error('SQL Error:', err.message);
    } finally {
        process.exit();
    }
}
test();
