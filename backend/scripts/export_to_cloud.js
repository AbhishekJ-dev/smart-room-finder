require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

const TABLES_ORDER = [
    'users',
    'subscription_plans', // Make sure this table exists remotely
    'owners',
    'admins',
    'rooms',
    'room_images',
    'subscriptions',
    'bookings',
    'notifications',
    'commissions',
    'payments'
];

async function migrateData() {
    console.log('🔄 Starting full migration from local MySQL to Cloud MySQL...');

    let localConn;
    let cloudConn;

    try {
        // 1. Connect Local
        localConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root123',
            database: 'smart_room_finder'
        });
        console.log('✅ Connected to Local DB');

        // 2. Connect Cloud
        cloudConn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        console.log('✅ Connected to Cloud DB');

        // 3. Migrate each table in order
        for (const tableName of TABLES_ORDER) {
            console.log(`\n📦 Migrating table: \`${tableName}\`...`);
            
            // Check if table exists locally
            const [localTables] = await localConn.execute(`SHOW TABLES LIKE '${tableName}'`);
            if (localTables.length === 0) {
                console.log(`⚠️ Table \`${tableName}\` does NOT exist locally. Skipping.`);
                continue;
            }

            // Check if table exists remotely
            const [cloudTables] = await cloudConn.execute(`SHOW TABLES LIKE '${tableName}'`);
            if (cloudTables.length === 0) {
                console.log(`⚠️ Table \`${tableName}\` does NOT exist remotely. Please create it first. Skipping.`);
                continue;
            }

            // Get columns of remote table to avoid inserting unknown columns
            const [cloudCols] = await cloudConn.execute(`SHOW COLUMNS FROM \`${tableName}\``);
            const validRemoteCols = cloudCols.map(c => c.Field);

            // Fetch local rows
            const [rows] = await localConn.execute(`SELECT * FROM \`${tableName}\``);
            console.log(`   Fetched ${rows.length} rows from local.`);

            if (rows.length === 0) continue;

            let insertedCount = 0;

            for (const row of rows) {
                // Filter row to only include cols that exist in remote
                const insertData = {};
                for (const key of Object.keys(row)) {
                    if (validRemoteCols.includes(key)) {
                        insertData[key] = row[key];
                    }
                }

                const keys = Object.keys(insertData);
                const objValues = keys.map(k => insertData[k]);
                
                const placeholders = keys.map(() => '?').join(', ');
                const colsString = keys.map(k => `\`${k}\``).join(', ');

                // Create the ON DUPLICATE KEY UPDATE string
                const updateString = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');

                try {
                    await cloudConn.execute(
                        `INSERT INTO \`${tableName}\` (${colsString}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateString}`,
                        objValues
                    );
                    insertedCount++;
                } catch (e) {
                    console.error(`   ❌ Failed to insert row into \`${tableName}\`:`, e.message);
                    // console.error('Row data:', insertData);
                }
            }
            console.log(`   ✅ Successfully processed ${insertedCount} rows for \`${tableName}\`.`);
        }

        console.log('\n🎉 Migration Complete!');

    } catch (e) {
        console.error('❌ Migration Error:', e.message);
    } finally {
        if (localConn) await localConn.end();
        if (cloudConn) await cloudConn.end();
    }
}

migrateData();
