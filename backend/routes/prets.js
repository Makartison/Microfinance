const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

router.get('/', auth, rbac('GERER_PRETS'), async (req, res) => {
  const { statut, page=1, limit=10 } = req.query;
  const offset = (page-1)*limit, params = [];
  let where = '';
  if (statut) { where = 'WHERE p.statut=?'; params.push(statut); }
  try {
    const [rows] = await pool.query(
      `SELECT p.*, CONCAT(c.nom,' ',c.prenom) AS client_nom FROM pret p JOIN client c ON p.id_client=c.id_client ${where} ORDER BY p.date_creation DESC LIMIT ? OFFSET ?`,
      [...params, +limit, +offset]
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/:id', auth, rbac('GERER_PRETS'), async (req, res) => {
  try {
    const [[pret]] = await pool.query(
      `SELECT p.*, CONCAT(c.nom,' ',c.prenom) AS client_nom, c.telephone, c.email FROM pret p JOIN client c ON p.id_client=c.id_client WHERE p.id_pret=?`,
      [req.params.id]
    );
    if (!pret) return res.status(404).json({ message: 'Prêt introuvable.' });
    const [echeances] = await pool.query(
      `SELECT e.*, IFNULL((SELECT SUM(montant) FROM remboursement WHERE id_echeance=e.id_echeance),0) AS total_paye FROM echeancier e WHERE e.id_pret=? ORDER BY e.numero_tranche`,
      [req.params.id]
    );
    res.json({ ...pret, echeances });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.post('/', auth, rbac('GERER_PRETS'), async (req, res) => {
  const { id_client, montant_capital, taux_interet, duree, frequence_remboursement, date_debut, id_garant } = req.body;
  if (!id_client||!montant_capital||!taux_interet||!duree||!frequence_remboursement)
    return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO pret (id_client,id_garant,montant_capital,taux_interet,duree,frequence_remboursement,date_debut) VALUES (?,?,?,?,?,?,?)`,
      [id_client, id_garant||null, +montant_capital, +taux_interet, +duree, frequence_remboursement, date_debut||null]
    );
    const id_pret = r.insertId;
    const n  = +duree, cap = +montant_capital;
    const pa = frequence_remboursement === 'MENSUEL' ? 12 : 52;
    const tr = +taux_interet / 100 / pa;
    const M  = tr === 0 ? cap/n : cap * tr / (1 - Math.pow(1+tr,-n));
    const d0 = date_debut ? new Date(date_debut) : new Date();
    for (let i=1; i<=n; i++) {
      const d = new Date(d0);
      frequence_remboursement === 'MENSUEL' ? d.setMonth(d.getMonth()+i) : d.setDate(d.getDate()+i*7);
      await conn.query(`INSERT INTO echeancier (id_pret,numero_tranche,date_echeance,montant_total_echeance) VALUES (?,?,?,?)`, [id_pret,i,d.toISOString().split('T')[0],M.toFixed(2)]);
    }
    await conn.query(`INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'CREDIT','Création prêt',?,?)`, [req.user.id,req.ip,JSON.stringify({id_pret,id_client,montant_capital})]);
    await conn.commit();
    res.status(201).json({ message: 'Prêt créé + échéancier généré.', id: id_pret, mensualite: M.toFixed(2) });
  } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({ message: 'Erreur serveur.' }); }
  finally { conn.release(); }
});

router.patch('/:id/decision', auth, rbac('GERER_PRETS'), async (req, res) => {
  const { decision, motif_refus } = req.body;
  if (!['ACCEPTE','REFUSE'].includes(decision)) return res.status(400).json({ message: 'Décision invalide.' });
  try {
    await pool.query(`UPDATE pret SET decision=?, motif_refus=?, statut=IF(?='ACCEPTE','EN_COURS',statut) WHERE id_pret=?`, [decision, motif_refus||null, decision, req.params.id]);
    await pool.query(`INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'CREDIT',?,?,?)`, [req.user.id,`Prêt ${decision}`,req.ip,JSON.stringify({id_pret:req.params.id})]);
    res.json({ message: `Prêt ${decision === 'ACCEPTE' ? 'approuvé' : 'refusé'}.` });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.post('/:id/remboursement', auth, rbac('GERER_PRETS'), async (req, res) => {
  const { id_echeance, montant } = req.body;
  if (!id_echeance||!montant) return res.status(400).json({ message: 'Échéance et montant requis.' });
  try {
    const [r] = await pool.query(`INSERT INTO remboursement (id_pret,id_echeance,id_utilisateur,montant) VALUES (?,?,?,?)`, [req.params.id, id_echeance, req.user.id, +montant]);
    res.status(201).json({ message: 'Remboursement enregistré.', id: r.insertId });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

module.exports = router;
