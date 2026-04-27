/**
 * Exécuter UNE SEULE FOIS : node create-admin.js
 */
const bcrypt = require('bcrypt');
const pool   = require('./db');

(async () => {
  try {
    const [ex] = await pool.query('SELECT id_utilisateur FROM utilisateur WHERE email = ?', ['admin@microfinance.mg']);
    if (ex.length) { console.log('⚠️  Admin déjà existant.'); process.exit(0); }

    const hash = await bcrypt.hash('Admin@1234', 10);
    await pool.query(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, id_role, statut) VALUES (?,?,?,?,1,1)`,
      ['Admin', 'Système', 'admin@microfinance.mg', hash]
    );
    console.log('✅ Admin créé : admin@microfinance.mg / Admin@1234');
    process.exit(0);
  } catch (e) { console.error('❌', e.message); process.exit(1); }
})();
