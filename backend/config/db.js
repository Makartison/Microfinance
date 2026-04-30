import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST?.includes('railway.app') 
    ? { rejectUnauthorized: false } 
    : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Test de connexion au démarrage
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Railway connecté avec succès !');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur MySQL :', err.message);
  });

export default pool;