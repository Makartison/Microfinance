const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

router.get('/', auth, rbac('GERER_COMPTES'), async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT cp.*, CONCAT(c.nom,' ',c.prenom) AS client_nom FROM compte cp JOIN client c ON cp.id_client=c.id_client ORDER BY cp.date_creation DESC LIMIT 200`);
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/client/:id', auth, rbac('GERER_COMPTES'), async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM compte WHERE id_client=? ORDER BY date_creation DESC`, [req.params.id]);
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.post('/', auth, rbac('GERER_COMPTES'), async (req, res) => {
  const { id_client, type_compte, devise = 'MGA' } = req.body;
  if (!id_client || !type_compte) return res.status(400).json({ message: 'Client et type de compte requis.' });
  if (!['EPARGNE','COURANT'].includes(type_compte)) return res.status(400).json({ message: 'Type invalide.' });
  const numero = 'CPT-' + Date.now() + '-' + Math.floor(Math.random()*1000);
  try {
    const [r] = await pool.query(`INSERT INTO compte (id_client,numero_compte,type_compte,devise) VALUES (?,?,?,?)`, [id_client,numero,type_compte,devise]);
    await pool.query(`INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'MODIFICATION','Création compte',?,?)`, [req.user.id,req.ip,JSON.stringify({id:r.insertId,numero})]);
    res.status(201).json({ message: 'Compte créé.', id: r.insertId, numero_compte: numero });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.patch('/:id/statut', auth, rbac('GERER_COMPTES'), async (req, res) => {
  const { statut } = req.body;
  if (!['ACTIF','SUSPENDU','FERME'].includes(statut)) return res.status(400).json({ message: 'Statut invalide.' });
  try {
    await pool.query(`UPDATE compte SET statut=? WHERE id_compte=?`, [statut, req.params.id]);
    res.json({ message: `Compte ${statut}.` });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

module.exports = router;
