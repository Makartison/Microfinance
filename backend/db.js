const mysql  = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'microfinance',
  port:               process.env.DB_PORT     || 3306,  // ← ajoutez cette ligne
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
});

pool.getConnection()
  .then(c => { console.log('✅ MySQL connecté'); c.release(); })
  .catch(e => console.error('❌ MySQL erreur:', e.message));

module.exports = pool;
