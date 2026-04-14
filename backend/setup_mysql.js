const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('🚀 Starting Database Setup...');
    
    // Connect WITHOUT selecting the database first to ensure we can create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root123',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true // Allow running the entire SQL file at once
    });

    try {
        console.log('✅ Connected to MySQL Server.');

        // 1. Read the schema file
        const schemaPath = path.join(__dirname, 'mysql_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // 2. Execute the schema (This will CREATE DATABASE and CREATE TABLEs)
        console.log('⏳ Executing schema script. Please wait...');
        await connection.query(schemaSql);
        console.log('🎉 Schema created successfully! All tables are ready.');

        // 3. Close this connection
        await connection.end();

        // 4. Run the data migration script
        console.log('⏳ Starting Data Migration...');
        require('./migrate_data.js'); // This will execute the migration script immediately
        
    } catch (err) {
        console.error('❌ Database Setup Failed:', err.message);
        await connection.end();
    }
}

setupDatabase();
