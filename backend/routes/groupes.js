const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

// GET /api/groupes
router.get('/', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.*, COUNT(cg.id_client) AS nb_membres
       FROM groupe_client g
       LEFT JOIN client_groupe cg ON g.id_groupe = cg.id_groupe
       GROUP BY g.id_groupe ORDER BY g.date_creation DESC`
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// GET /api/groupes/:id — membres du groupe
router.get('/:id', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  try {
    const [[groupe]] = await pool.query(`SELECT * FROM groupe_client WHERE id_groupe = ?`, [req.params.id]);
    if (!groupe) return res.status(404).json({ message: 'Groupe introuvable.' });

    const [membres] = await pool.query(
      `SELECT c.* FROM client c
       JOIN client_groupe cg ON c.id_client = cg.id_client
       WHERE cg.id_groupe = ?`, [req.params.id]
    );
    res.json({ ...groupe, membres });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// POST /api/groupes — créer un groupe
router.post('/', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  const { nom_groupe } = req.body;
  if (!nom_groupe) return res.status(400).json({ message: 'Nom du groupe requis.' });
  try {
    const [r] = await pool.query(`INSERT INTO groupe_client (nom_groupe) VALUES (?)`, [nom_groupe]);
    await pool.query(
      `INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'MODIFICATION','Création groupe',?,?)`,
      [req.user.id, req.ip, JSON.stringify({ id: r.insertId, nom_groupe })]
    );
    res.status(201).json({ message: 'Groupe créé.', id: r.insertId });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// PUT /api/groupes/:id
router.put('/:id', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  const { nom_groupe } = req.body;
  if (!nom_groupe) return res.status(400).json({ message: 'Nom requis.' });
  try {
    await pool.query(`UPDATE groupe_client SET nom_groupe = ? WHERE id_groupe = ?`, [nom_groupe, req.params.id]);
    res.json({ message: 'Groupe mis à jour.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// DELETE /api/groupes/:id
router.delete('/:id', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM groupe_client WHERE id_groupe = ?`, [req.params.id]);
    res.json({ message: 'Groupe supprimé.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// POST /api/groupes/:id/membres — ajouter un client au groupe
router.post('/:id/membres', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  const { id_client } = req.body;
  if (!id_client) return res.status(400).json({ message: 'id_client requis.' });
  try {
    await pool.query(`INSERT IGNORE INTO client_groupe (id_client, id_groupe) VALUES (?,?)`, [id_client, req.params.id]);
    res.status(201).json({ message: 'Membre ajouté.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// DELETE /api/groupes/:id/membres/:id_client
router.delete('/:id/membres/:id_client', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM client_groupe WHERE id_groupe = ? AND id_client = ?`, [req.params.id, req.params.id_client]);
    res.json({ message: 'Membre retiré.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

module.exports = router;
