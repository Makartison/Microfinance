const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');

// GET /api/notifications — liste des notifications non lues
router.get('/', auth, async (req, res) => {
  try {
    const notifications = [];

    // 1. Prêts en retard
    const [retards] = await pool.query(
      `SELECT COUNT(*) AS nb FROM echeancier e
       JOIN pret p ON e.id_pret = p.id_pret
       WHERE e.statut IN ('RETARD','A_PAYER') AND e.date_echeance < CURDATE()
         AND p.statut = 'EN_COURS'`
    );
    if (retards[0].nb > 0) notifications.push({
      id: 'retards', type: 'danger',
      message: `${retards[0].nb} échéance(s) en retard`,
      lien: '/dashboard/prets',
      date: new Date(),
    });

    // 2. Prêts en attente de décision
    const [enAttente] = await pool.query(
      `SELECT COUNT(*) AS nb FROM pret WHERE decision = 'EN_ATTENTE'`
    );
    if (enAttente[0].nb > 0) notifications.push({
      id: 'attente', type: 'warning',
      message: `${enAttente[0].nb} prêt(s) en attente d'approbation`,
      lien: '/dashboard/prets',
      date: new Date(),
    });

    // 3. Échéances du jour
    const [aujourdhui] = await pool.query(
      `SELECT COUNT(*) AS nb FROM echeancier e
       JOIN pret p ON e.id_pret = p.id_pret
       WHERE e.date_echeance = CURDATE() AND e.statut IN ('A_PAYER','PARTIEL')
         AND p.statut = 'EN_COURS'`
    );
    if (aujourdhui[0].nb > 0) notifications.push({
      id: 'today', type: 'info',
      message: `${aujourdhui[0].nb} remboursement(s) attendu(s) aujourd'hui`,
      lien: '/dashboard',
      date: new Date(),
    });

    // 4. Nouveaux clients ce jour
    const [newClients] = await pool.query(
      `SELECT COUNT(*) AS nb FROM client WHERE DATE(date_inscription) = CURDATE()`
    );
    if (newClients[0].nb > 0) notifications.push({
      id: 'newcli', type: 'success',
      message: `${newClients[0].nb} nouveau(x) client(s) inscrit(s) aujourd'hui`,
      lien: '/dashboard/clients',
      date: new Date(),
    });

    // 5. Comptes suspendus
    const [suspendus] = await pool.query(
      `SELECT COUNT(*) AS nb FROM compte WHERE statut = 'SUSPENDU'`
    );
    if (suspendus[0].nb > 0) notifications.push({
      id: 'suspendus', type: 'warning',
      message: `${suspendus[0].nb} compte(s) suspendu(s)`,
      lien: '/dashboard/comptes',
      date: new Date(),
    });

    res.json({ notifications, total: notifications.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
