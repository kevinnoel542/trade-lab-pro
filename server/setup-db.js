/**
 * Run this script ONCE to create the TradeVault database and tables.
 *   node setup-db.js
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('✅ Connected to MySQL');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(schema);

  console.log('✅ Database "tradevault" and tables created successfully');
  await conn.end();
}

run().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
