require('dotenv').config();
const mysql = require('mysql2/promise');

const PLACEHOLDER_URL = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600';

async function cleanupBrokenImages() {
    console.log('--- Starting Broken Image Cleanup ---');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('Connected to database.');

        // Find how many broken images exist
        const [rows] = await connection.execute(
            'SELECT COUNT(*) as count FROM room_images WHERE image_url LIKE "%/uploads/%"'
        );
        
        const brokenCount = rows[0].count;
        console.log(`Found ${brokenCount} broken image links pointing to local '/uploads/'.`);

        if (brokenCount > 0) {
            console.log(`Updating links to fallback placeholder...`);
            const [updateResult] = await connection.execute(
                'UPDATE room_images SET image_url = ? WHERE image_url LIKE "%/uploads/%"',
                [PLACEHOLDER_URL]
            );
            
            console.log(`Successfully updated ${updateResult.affectedRows} rows.`);
        } else {
            console.log('No broken links found. Database is clean.');
        }

    } catch (error) {
        console.error('Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
        console.log('--- Cleanup Finished ---');
    }
}

cleanupBrokenImages();
