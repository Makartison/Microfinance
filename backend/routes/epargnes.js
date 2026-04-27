// routes/epargnes.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

// GET /api/epargnes — liste tous les comptes épargne avec stats
router.get('/', auth, rbac('GERER_COMPTES'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const like   = `%${search}%`;

    const [rows] = await pool.query(
      `SELECT cp.*, CONCAT(c.nom,' ',c.prenom) AS client_nom, c.telephone,
              (SELECT IFNULL(SUM(montant),0) FROM transactions t
               JOIN type_transaction tt ON t.id_type = tt.id_type
               WHERE t.id_compte = cp.id_compte AND tt.coefficient = 1) AS total_depots,
              (SELECT IFNULL(SUM(montant),0) FROM transactions t
               JOIN type_transaction tt ON t.id_type = tt.id_type
               WHERE t.id_compte = cp.id_compte AND tt.coefficient = -1) AS total_retraits,
              (SELECT COUNT(*) FROM transactions WHERE id_compte = cp.id_compte) AS nb_transactions
       FROM compte cp
       JOIN client c ON cp.id_client = c.id_client
       WHERE cp.type_compte = 'EPARGNE'
         AND (c.nom LIKE ? OR c.prenom LIKE ? OR cp.numero_compte LIKE ?)
       ORDER BY cp.date_creation DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, +limit, +offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM compte cp
       JOIN client c ON cp.id_client = c.id_client
       WHERE cp.type_compte = 'EPARGNE'
         AND (c.nom LIKE ? OR c.prenom LIKE ? OR cp.numero_compte LIKE ?)`,
      [like, like, like]
    );

    // Stats globales
    const [[stats]] = await pool.query(
      `SELECT
         COUNT(*)                        AS total_comptes,
         IFNULL(SUM(solde), 0)           AS solde_total,
         IFNULL(AVG(solde), 0)           AS solde_moyen,
         COUNT(CASE WHEN statut='ACTIF' THEN 1 END) AS comptes_actifs
       FROM compte WHERE type_compte = 'EPARGNE'`
    );

    res.json({ data: rows, total: +total, page: +page, limit: +limit, stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/epargnes/:id — détail d'un compte épargne
router.get('/:id', auth, rbac('GERER_COMPTES'), async (req, res) => {
  try {
    const [[compte]] = await pool.query(
      `SELECT cp.*, CONCAT(c.nom,' ',c.prenom) AS client_nom, c.telephone, c.email
       FROM compte cp JOIN client c ON cp.id_client = c.id_client
       WHERE cp.id_compte = ? AND cp.type_compte = 'EPARGNE'`,
      [req.params.id]
    );
    if (!compte) return res.status(404).json({ message: 'Compte épargne introuvable.' });

    const [transactions] = await pool.query(
      `SELECT t.*, tt.nom_type, tt.coefficient
       FROM transactions t
       JOIN type_transaction tt ON t.id_type = tt.id_type
       WHERE t.id_compte = ?
       ORDER BY t.date_transaction DESC LIMIT 20`,
      [req.params.id]
    );

    res.json({ ...compte, transactions });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/epargnes/depot — faire un dépôt
router.post('/depot', auth, rbac('GERER_COMPTES'), async (req, res) => {
  const { id_compte, montant, description } = req.body;
  if (!id_compte || !montant || +montant <= 0)
    return res.status(400).json({ message: 'Compte et montant requis.' });
  try {
    const [[compte]] = await pool.query(
      `SELECT statut, type_compte FROM compte WHERE id_compte = ?`, [id_compte]
    );
    if (!compte) return res.status(404).json({ message: 'Compte introuvable.' });
    if (compte.statut !== 'ACTIF') return res.status(400).json({ message: 'Compte inactif.' });
    if (compte.type_compte !== 'EPARGNE') return res.status(400).json({ message: 'Ce compte n\'est pas un compte épargne.' });

    const [r] = await pool.query(
      `INSERT INTO transactions (id_compte, id_utilisateur, id_type, montant, description)
       VALUES (?, ?, 1, ?, ?)`,
      [id_compte, req.user.id, +montant, description || 'Dépôt épargne']
    );
    res.status(201).json({ message: 'Dépôt effectué avec succès.', id: r.insertId });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/epargnes/retrait — faire un retrait
router.post('/retrait', auth, rbac('GERER_COMPTES'), async (req, res) => {
  const { id_compte, montant, description } = req.body;
  if (!id_compte || !montant || +montant <= 0)
    return res.status(400).json({ message: 'Compte et montant requis.' });
  try {
    const [[compte]] = await pool.query(
      `SELECT statut, solde FROM compte WHERE id_compte = ?`, [id_compte]
    );
    if (!compte) return res.status(404).json({ message: 'Compte introuvable.' });
    if (compte.statut !== 'ACTIF') return res.status(400).json({ message: 'Compte inactif.' });
    if (+compte.solde < +montant) return res.status(400).json({ message: 'Solde insuffisant.' });

    const [r] = await pool.query(
      `INSERT INTO transactions (id_compte, id_utilisateur, id_type, montant, description)
       VALUES (?, ?, 2, ?, ?)`,
      [id_compte, req.user.id, +montant, description || 'Retrait épargne']
    );
    res.status(201).json({ message: 'Retrait effectué avec succès.', id: r.insertId });
  } catch (e) {
    if (e.sqlMessage?.includes('Solde insuffisant'))
      return res.status(400).json({ message: 'Solde insuffisant.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
