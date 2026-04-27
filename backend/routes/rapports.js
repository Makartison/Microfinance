// routes/rapports.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

// GET /api/rapports/resume — résumé général
router.get('/resume', auth, rbac('VOIR_RAPPORTS'), async (req, res) => {
  try {
    const [[clients]]  = await pool.query(`SELECT COUNT(*) AS total, COUNT(CASE WHEN statut='ACTIF' THEN 1 END) AS actifs FROM client`);
    const [[comptes]]  = await pool.query(`SELECT COUNT(*) AS total, IFNULL(SUM(solde),0) AS solde_total FROM compte WHERE statut='ACTIF'`);
    const [[prets]]    = await pool.query(`SELECT COUNT(*) AS total, IFNULL(SUM(montant_capital),0) AS montant_total, COUNT(CASE WHEN statut='EN_COURS' THEN 1 END) AS en_cours, COUNT(CASE WHEN statut='EN_RETARD' THEN 1 END) AS en_retard FROM pret`);
    const [[rembours]] = await pool.query(`SELECT IFNULL(SUM(montant),0) AS total_rembourse, COUNT(*) AS nb_remboursements FROM remboursement`);
    const [[epargne]]  = await pool.query(`SELECT IFNULL(SUM(solde),0) AS total FROM compte WHERE type_compte='EPARGNE' AND statut='ACTIF'`);

    res.json({ clients, comptes, prets, rembours, epargne });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/rapports/prets-par-mois — évolution mensuelle des prêts
router.get('/prets-par-mois', auth, rbac('VOIR_RAPPORTS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(date_creation,'%Y-%m') AS mois,
         DATE_FORMAT(date_creation,'%b %Y') AS mois_label,
         COUNT(*) AS nb_prets,
         IFNULL(SUM(montant_capital),0) AS montant_total,
         COUNT(CASE WHEN statut='EN_RETARD' THEN 1 END) AS en_retard,
         COUNT(CASE WHEN statut='REMBOURSE' THEN 1 END) AS rembourses
       FROM pret
       WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(date_creation,'%Y-%m'), mois_label
       ORDER BY mois`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/rapports/remboursements-par-mois
router.get('/remboursements-par-mois', auth, rbac('VOIR_RAPPORTS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(date_paiement,'%Y-%m') AS mois,
         DATE_FORMAT(date_paiement,'%b %Y') AS mois_label,
         COUNT(*) AS nb_remboursements,
         IFNULL(SUM(montant),0) AS montant_total
       FROM remboursement
       WHERE date_paiement >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(date_paiement,'%Y-%m'), mois_label
       ORDER BY mois`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/rapports/epargnes-par-mois
router.get('/epargnes-par-mois', auth, rbac('VOIR_RAPPORTS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(t.date_transaction,'%Y-%m') AS mois,
         DATE_FORMAT(t.date_transaction,'%b %Y') AS mois_label,
         IFNULL(SUM(CASE WHEN tt.coefficient=1 THEN t.montant ELSE 0 END),0) AS depots,
         IFNULL(SUM(CASE WHEN tt.coefficient=-1 THEN t.montant ELSE 0 END),0) AS retraits
       FROM transactions t
       JOIN compte c ON t.id_compte = c.id_compte
       JOIN type_transaction tt ON t.id_type = tt.id_type
       WHERE c.type_compte = 'EPARGNE'
         AND t.date_transaction >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(t.date_transaction,'%Y-%m'), mois_label
       ORDER BY mois`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/rapports/retards — prêts en retard détaillés
router.get('/retards', auth, rbac('VOIR_RAPPORTS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id_pret, CONCAT(c.nom,' ',c.prenom) AS client_nom, c.telephone,
              p.montant_capital, p.taux_interet,
              COUNT(e.id_echeance) AS nb_echeances_retard,
              IFNULL(SUM(e.montant_total_echeance),0) AS montant_retard,
              MIN(e.date_echeance) AS premiere_echeance_retard
       FROM pret p
       JOIN client c ON p.id_client = c.id_client
       JOIN echeancier e ON e.id_pret = p.id_pret
       WHERE e.statut IN ('RETARD','A_PAYER') AND e.date_echeance < CURDATE()
       GROUP BY p.id_pret, client_nom, c.telephone, p.montant_capital, p.taux_interet
       ORDER BY montant_retard DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/rapports/remboursements-du-jour
router.get('/remboursements-du-jour', auth, rbac('VOIR_RAPPORTS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, CONCAT(c.nom,' ',c.prenom) AS client_nom,
              c.telephone, p.montant_capital,
              e.numero_tranche, e.date_echeance, e.montant_total_echeance
       FROM remboursement r
       JOIN pret p ON r.id_pret = p.id_pret
       JOIN client c ON p.id_client = c.id_client
       JOIN echeancier e ON r.id_echeance = e.id_echeance
       WHERE DATE(r.date_paiement) = CURDATE()
       ORDER BY r.date_paiement DESC`
    );

    const [[{ total }]] = await pool.query(
      `SELECT IFNULL(SUM(montant),0) AS total FROM remboursement WHERE DATE(date_paiement) = CURDATE()`
    );

    res.json({ data: rows, total_du_jour: +total });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
