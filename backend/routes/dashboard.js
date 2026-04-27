const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');

router.get('/stats', auth, async (req, res) => {
  try {
    const [[{ total_clients }]]          = await pool.query(`SELECT COUNT(*) AS total_clients FROM client WHERE statut='ACTIF'`);
    const [[{ nouveaux_clients_mois }]]  = await pool.query(`SELECT COUNT(*) AS nouveaux_clients_mois FROM client WHERE MONTH(date_inscription)=MONTH(NOW()) AND YEAR(date_inscription)=YEAR(NOW())`);
    const [[{ total_prets, montant_prets }]] = await pool.query(`SELECT COUNT(*) AS total_prets, IFNULL(SUM(montant_capital),0) AS montant_prets FROM pret WHERE statut='EN_COURS'`);
    const [[{ montant_prets_mois }]]     = await pool.query(`SELECT IFNULL(SUM(montant_capital),0) AS montant_prets_mois FROM pret WHERE MONTH(date_creation)=MONTH(NOW()) AND YEAR(date_creation)=YEAR(NOW())`);
    const [[{ epargne_totale }]]         = await pool.query(`SELECT IFNULL(SUM(solde),0) AS epargne_totale FROM compte WHERE type_compte='EPARGNE' AND statut='ACTIF'`);
    const [[{ epargne_mois }]]           = await pool.query(`SELECT IFNULL(SUM(t.montant),0) AS epargne_mois FROM transactions t JOIN compte c ON t.id_compte=c.id_compte JOIN type_transaction tt ON t.id_type=tt.id_type WHERE c.type_compte='EPARGNE' AND tt.coefficient=1 AND MONTH(t.date_transaction)=MONTH(NOW()) AND YEAR(t.date_transaction)=YEAR(NOW())`);
    const [[{ remboursements_jour }]]    = await pool.query(`SELECT IFNULL(SUM(montant),0) AS remboursements_jour FROM remboursement WHERE DATE(date_paiement)=CURDATE()`);

    res.json({ total_clients, nouveaux_clients_mois, total_prets, montant_prets, montant_prets_mois, epargne_totale, epargne_mois, remboursements_jour });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/statistiques-mensuelles', auth, async (req, res) => {
  try {
    const [prets]   = await pool.query(`SELECT DATE_FORMAT(date_creation,'%b') AS mois, MONTH(date_creation) AS num_mois, IFNULL(SUM(montant_capital),0) AS total FROM pret WHERE date_creation>=DATE_SUB(NOW(),INTERVAL 6 MONTH) GROUP BY num_mois,mois ORDER BY num_mois`);
    const [epargnes]= await pool.query(`SELECT DATE_FORMAT(t.date_transaction,'%b') AS mois, MONTH(t.date_transaction) AS num_mois, IFNULL(SUM(t.montant),0) AS total FROM transactions t JOIN compte c ON t.id_compte=c.id_compte JOIN type_transaction tt ON t.id_type=tt.id_type WHERE c.type_compte='EPARGNE' AND tt.coefficient=1 AND t.date_transaction>=DATE_SUB(NOW(),INTERVAL 6 MONTH) GROUP BY num_mois,mois ORDER BY num_mois`);
    res.json({ prets, epargnes });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/derniers-prets', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT p.id_pret, CONCAT(c.nom,' ',c.prenom) AS client, p.montant_capital, p.statut, p.decision, p.date_creation FROM pret p JOIN client c ON p.id_client=c.id_client ORDER BY p.date_creation DESC LIMIT 5`);
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/activites-recentes', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT t.id_transaction, tt.nom_type, tt.coefficient, t.montant, t.date_transaction, CONCAT(c.nom,' ',c.prenom) AS client_nom FROM transactions t JOIN type_transaction tt ON t.id_type=tt.id_type JOIN compte cp ON t.id_compte=cp.id_compte JOIN client c ON cp.id_client=c.id_client ORDER BY t.date_transaction DESC LIMIT 10`);
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/echeances-du-mois', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT e.id_echeance, e.date_echeance, e.montant_total_echeance, e.statut, CONCAT(c.nom,' ',c.prenom) AS client FROM echeancier e JOIN pret p ON e.id_pret=p.id_pret JOIN client c ON p.id_client=c.id_client WHERE MONTH(e.date_echeance)=MONTH(NOW()) AND YEAR(e.date_echeance)=YEAR(NOW()) AND e.statut IN ('A_PAYER','RETARD','PARTIEL') ORDER BY e.date_echeance`);
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

module.exports = router;
