const db = require('./config/db');
async function check() {
  try {
    const [cols] = await db.execute('DESCRIBE users');
    console.log(cols);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
