const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

router.get('/', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;
  const like = `%${search}%`, offset = (page - 1) * limit;
  try {
    const [data]         = await pool.query(`SELECT * FROM client WHERE nom LIKE ? OR prenom LIKE ? OR telephone LIKE ? OR email LIKE ? ORDER BY date_inscription DESC LIMIT ? OFFSET ?`, [like,like,like,like,+limit,+offset]);
    const [[{ total }]]  = await pool.query(`SELECT COUNT(*) AS total FROM client WHERE nom LIKE ? OR prenom LIKE ? OR telephone LIKE ? OR email LIKE ?`, [like,like,like,like]);
    res.json({ data, total, page: +page, limit: +limit });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/:id', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, (SELECT COUNT(*) FROM pret WHERE id_client=c.id_client) AS nb_prets,
       (SELECT IFNULL(SUM(solde),0) FROM compte WHERE id_client=c.id_client AND statut='ACTIF') AS solde_total
       FROM client c WHERE c.id_client=?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Client introuvable.' });
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.post('/', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  const { nom, prenom, sexe, date_naissance, adresse, telephone, email, profession, revenu_mensuel, piece_identite, numero_identite } = req.body;
  if (!nom || !prenom) return res.status(400).json({ message: 'Nom et prénom requis.' });
  try {
    const [r] = await pool.query(
      `INSERT INTO client (nom,prenom,sexe,date_naissance,adresse,telephone,email,profession,revenu_mensuel,piece_identite,numero_identite) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [nom,prenom,sexe||null,date_naissance||null,adresse||null,telephone||null,email||null,profession||null,revenu_mensuel||null,piece_identite||null,numero_identite||null]
    );
    await pool.query(`INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'MODIFICATION','Création client',?,?)`, [req.user.id, req.ip, JSON.stringify({id:r.insertId,nom,prenom})]);
    res.status(201).json({ message: 'Client créé.', id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email, téléphone ou numéro d\'identité déjà utilisé.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:id', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  const { nom, prenom, sexe, date_naissance, adresse, telephone, email, profession, revenu_mensuel, statut } = req.body;
  if (!nom || !prenom) return res.status(400).json({ message: 'Nom et prénom requis.' });
  try {
    const [r] = await pool.query(
      `UPDATE client SET nom=?,prenom=?,sexe=?,date_naissance=?,adresse=?,telephone=?,email=?,profession=?,revenu_mensuel=?,statut=? WHERE id_client=?`,
      [nom,prenom,sexe||null,date_naissance||null,adresse||null,telephone||null,email||null,profession||null,revenu_mensuel||null,statut||'ACTIF',req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ message: 'Client introuvable.' });
    await pool.query(`INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'MODIFICATION','Modification client',?,?)`, [req.user.id, req.ip, JSON.stringify({id:req.params.id})]);
    res.json({ message: 'Client mis à jour.' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email ou téléphone déjà utilisé.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;

// DELETE /api/clients/:id
router.delete('/:id', auth, rbac('GERER_CLIENTS'), async (req, res) => {
  try {
    const [r] = await pool.query(`DELETE FROM client WHERE id_client = ?`, [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Client introuvable.' });
    await pool.query(
      `INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'MODIFICATION','Suppression client',?,?)`,
      [req.user.id, req.ip, JSON.stringify({ id_client: req.params.id })]
    );
    res.json({ message: 'Client supprimé.' });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(400).json({ message: 'Impossible de supprimer : ce client a des comptes ou prêts actifs.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});
