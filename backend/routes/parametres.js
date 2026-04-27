const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

// GET /api/parametres/frais
router.get('/frais', auth, rbac('GERER_PARAMETRES'), async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM frais ORDER BY id_frais`);
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.post('/frais', auth, rbac('GERER_PARAMETRES'), async (req, res) => {
  const { nom_frais, montant, type } = req.body;
  if (!nom_frais || !montant || !type) return res.status(400).json({ message: 'Données manquantes.' });
  try {
    const [r] = await pool.query(`INSERT INTO frais (nom_frais, montant, type) VALUES (?,?,?)`, [nom_frais, montant, type]);
    res.status(201).json({ message: 'Frais créé.', id: r.insertId });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.put('/frais/:id', auth, rbac('GERER_PARAMETRES'), async (req, res) => {
  const { nom_frais, montant, type, actif } = req.body;
  try {
    await pool.query(`UPDATE frais SET nom_frais=?, montant=?, type=?, actif=? WHERE id_frais=?`, [nom_frais, montant, type, actif ?? 1, req.params.id]);
    res.json({ message: 'Frais mis à jour.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.delete('/frais/:id', auth, rbac('GERER_PARAMETRES'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM frais WHERE id_frais=?`, [req.params.id]);
    res.json({ message: 'Frais supprimé.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// GET /api/parametres/audit — journal d'audit
router.get('/audit', auth, rbac('GERER_PARAMETRES'), async (req, res) => {
  const { page=1, limit=20 } = req.query;
  const offset = (page-1)*limit;
  try {
    const [rows] = await pool.query(
      `SELECT ja.*, CONCAT(u.prenom,' ',u.nom) AS utilisateur_nom
       FROM journal_audit ja LEFT JOIN utilisateur u ON ja.id_utilisateur=u.id_utilisateur
       ORDER BY ja.date_action DESC LIMIT ? OFFSET ?`, [+limit, +offset]
    );
    const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM journal_audit`);
    res.json({ data: rows, total });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// GET /api/parametres/connexions — journal de connexions
router.get('/connexions', auth, rbac('GERER_PARAMETRES'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT jc.*, CONCAT(u.prenom,' ',u.nom) AS utilisateur_nom
       FROM journal_connexion jc LEFT JOIN utilisateur u ON jc.id_utilisateur=u.id_utilisateur
       ORDER BY jc.date_connexion DESC LIMIT 50`
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

module.exports = router;
