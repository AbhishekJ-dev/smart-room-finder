const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
    console.log('🚀 Initializing FreeSQL Database Synchronization...');
    
    // Connect to MySQL
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });

    try {
        console.log(`✅ Connected to database: ${process.env.DB_NAME}`);

        // 1. Run the base schema from mysql_schema.sql
        const schemaPath = path.join(__dirname, '..', 'mysql_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('⏳ Creating base tables...');
        await connection.query(schemaSql);
        console.log('✅ Base tables ensured.');

        // 2. Add missing columns used in stats/rooms but missing from schema
        console.log('⏳ Checking for missing business columns...');
        
        const migrations = [
            { table: 'rooms', column: 'is_deleted', definition: 'TINYINT(1) DEFAULT 0' },
            { table: 'rooms', column: 'annual_rent', definition: 'DECIMAL(10,2) DEFAULT 0.00' },
            { table: 'rooms', column: 'city', definition: 'VARCHAR(255) DEFAULT ""' },
            { table: 'rooms', column: 'tenant_type', definition: 'VARCHAR(50) DEFAULT "Anyone"' },
            { table: 'bookings', column: 'rating', definition: 'INT DEFAULT 0' },
            { table: 'users', column: 'is_deleted', definition: 'TINYINT(1) DEFAULT 0' },
            { table: 'subscriptions', column: 'is_active', definition: 'TINYINT(1) DEFAULT 1' }
        ];

        for (const m of migrations) {
            const [cols] = await connection.execute(`SHOW COLUMNS FROM ${m.table} LIKE '${m.column}'`);
            if (cols.length === 0) {
                await connection.execute(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.definition}`);
                console.log(`   + Added [${m.column}] to table [${m.table}]`);
            } else {
                console.log(`   - [${m.column}] already exists in table [${m.table}]`);
            }
        }

        console.log('🎉 Database synchronization complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Initialization Failed:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

initDatabase();
