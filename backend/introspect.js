const mysql = require('mysql2/promise');
require('dotenv').config();

async function introspect() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_room_finder'
  });

  console.log('--- TABLE: users ---');
  const [usersCols] = await connection.execute('DESCRIBE users');
  console.table(usersCols);

  console.log('--- TABLE: rooms ---');
  const [roomsCols] = await connection.execute('DESCRIBE rooms');
  console.table(roomsCols);

  console.log('--- TABLE: bookings ---');
  const [bookingsCols] = await connection.execute('DESCRIBE bookings');
  console.table(bookingsCols);

  console.log('--- SAMPLE: bookings ---');
  const [bookings] = await connection.execute('SELECT * FROM bookings LIMIT 5');
  console.table(bookings);

  await connection.end();
}

introspect().catch(console.error);
