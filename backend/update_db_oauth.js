require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root123',
      database: process.env.DB_NAME || 'smart_room_finder',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to DB');

    // Make password nullable for OAuth users
    await db.execute('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL');
    console.log('✅ password column made nullable');

    // Add google_id column if not exists
    try {
      await db.execute('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL DEFAULT NULL AFTER id');
      console.log('✅ google_id column added');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  google_id column already exists');
      } else throw e;
    }

    // Add unique index on google_id if not exists
    try {
      await db.execute('ALTER TABLE users ADD UNIQUE INDEX idx_google_id (google_id)');
      console.log('✅ google_id unique index added');
    } catch(e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  google_id index already exists');
      } else throw e;
    }

    await db.end();
    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
