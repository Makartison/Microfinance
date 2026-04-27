const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

// GET /api/utilisateurs
router.get('/', auth, rbac('GERER_UTILISATEURS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.statut,
              u.compte_verrouille, u.tentative_connexion,
              u.date_derniere_connexion, u.date_creation,
              r.id_role, r.nom_role
       FROM utilisateur u JOIN role r ON u.id_role = r.id_role
       ORDER BY u.date_creation DESC`
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// GET /api/utilisateurs/:id
router.get('/:id', auth, rbac('GERER_UTILISATEURS'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.statut,
              u.compte_verrouille, u.date_derniere_connexion,
              r.id_role, r.nom_role
       FROM utilisateur u JOIN role r ON u.id_role = r.id_role
       WHERE u.id_utilisateur = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// POST /api/utilisateurs — créer
router.post('/', auth, rbac('GERER_UTILISATEURS'), async (req, res) => {
  const { nom, prenom, email, mot_de_passe, id_role } = req.body;
  if (!nom || !prenom || !email || !mot_de_passe || !id_role)
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  try {
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const [r]  = await pool.query(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, id_role) VALUES (?,?,?,?,?)`,
      [nom, prenom, email, hash, id_role]
    );
    await pool.query(
      `INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'MODIFICATION','Création utilisateur',?,?)`,
      [req.user.id, req.ip, JSON.stringify({ id: r.insertId, email, id_role })]
    );
    res.status(201).json({ message: 'Utilisateur créé.', id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email déjà utilisé.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/utilisateurs/:id — modifier
router.put('/:id', auth, rbac('GERER_UTILISATEURS'), async (req, res) => {
  const { nom, prenom, email, id_role, statut } = req.body;
  if (!nom || !prenom || !email || !id_role)
    return res.status(400).json({ message: 'Champs requis manquants.' });
  try {
    await pool.query(
      `UPDATE utilisateur SET nom=?, prenom=?, email=?, id_role=?, statut=? WHERE id_utilisateur=?`,
      [nom, prenom, email, id_role, statut ?? 1, req.params.id]
    );
    res.json({ message: 'Utilisateur mis à jour.' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email déjà utilisé.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /api/utilisateurs/:id
router.delete('/:id', auth, rbac('GERER_UTILISATEURS'), async (req, res) => {
  if (+req.params.id === req.user.id)
    return res.status(400).json({ message: 'Impossible de supprimer votre propre compte.' });
  try {
    await pool.query(`DELETE FROM utilisateur WHERE id_utilisateur = ?`, [req.params.id]);
    res.json({ message: 'Utilisateur supprimé.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// PATCH /api/utilisateurs/:id/deverrouiller — débloquer un compte
router.patch('/:id/deverrouiller', auth, rbac('GERER_UTILISATEURS'), async (req, res) => {
  try {
    await pool.query(
      `UPDATE utilisateur SET compte_verrouille=0, tentative_connexion=0 WHERE id_utilisateur=?`,
      [req.params.id]
    );
    res.json({ message: 'Compte déverrouillé.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// PATCH /api/utilisateurs/:id/mot-de-passe — changer mot de passe
router.patch('/:id/mot-de-passe', auth, rbac('GERER_UTILISATEURS'), async (req, res) => {
  const { nouveau_mot_de_passe } = req.body;
  if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6)
    return res.status(400).json({ message: 'Mot de passe trop court (min 6 caractères).' });
  try {
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query(`UPDATE utilisateur SET mot_de_passe=? WHERE id_utilisateur=?`, [hash, req.params.id]);
    res.json({ message: 'Mot de passe modifié.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// GET /api/utilisateurs/roles/liste
router.get('/roles/liste', auth, async (req, res) => {
  try {
    const [roles] = await pool.query(`SELECT * FROM role ORDER BY id_role`);
    const [perms] = await pool.query(
      `SELECT rp.id_role, p.nom_permission FROM role_permission rp JOIN permission p ON rp.id_permission=p.id_permission`
    );
    const result = roles.map(r => ({
      ...r,
      permissions: perms.filter(p => p.id_role === r.id_role).map(p => p.nom_permission),
    }));
    res.json(result);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// PUT /api/utilisateurs/roles/:id_role/permissions — modifier permissions d'un rôle
router.put('/roles/:id_role/permissions', auth, rbac('GERER_PARAMETRES'), async (req, res) => {
  const { permissions } = req.body; // array de nom_permission
  if (!Array.isArray(permissions)) return res.status(400).json({ message: 'permissions doit être un tableau.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM role_permission WHERE id_role = ?`, [req.params.id_role]);
    if (permissions.length > 0) {
      const [permsRows] = await conn.query(
        `SELECT id_permission, nom_permission FROM permission WHERE nom_permission IN (?)`, [permissions]
      );
      for (const p of permsRows) {
        await conn.query(`INSERT INTO role_permission (id_role, id_permission) VALUES (?,?)`, [req.params.id_role, p.id_permission]);
      }
    }
    await conn.commit();
    res.json({ message: 'Permissions mises à jour.' });
  } catch (e) { await conn.rollback(); res.status(500).json({ message: 'Erreur serveur.' }); }
  finally { conn.release(); }
});

module.exports = router;
