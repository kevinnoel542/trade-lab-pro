const mysql = require('mysql2/promise');
require('dotenv').config();

// Force 127.0.0.1 instead of 'localhost' so mysql2 always uses TCP
// (on Linux, 'localhost' can resolve to a Unix socket which mysql2 doesn't support well)
const host = (process.env.MYSQL_HOST || 'localhost').replace('localhost', '127.0.0.1');

const pool = mysql.createPool({
  host,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'tradevault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Fix: JSON columns must be read as utf8 string to avoid BINARY warnings
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      try { return val ? JSON.parse(val) : null; } catch { return null; }
    }
    return next();
  },
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully to', host);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD in server/.env');
  });

module.exports = pool;
