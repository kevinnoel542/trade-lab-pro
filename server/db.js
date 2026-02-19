const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'tradevault',
  waitForConnections: true,
  connectionLimit: 10,
  // Return JSON columns as parsed objects
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string();
      return val ? JSON.parse(val) : null;
    }
    return next();
  },
});

module.exports = pool;
