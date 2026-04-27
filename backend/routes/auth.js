const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');

/* ── LOGIN ─────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  if (!email || !mot_de_passe)
    return res.status(400).json({ message: 'Email et mot de passe requis.' });

  try {
    const [rows] = await pool.query(
      `SELECT u.*, r.nom_role FROM utilisateur u
       JOIN role r ON u.id_role = r.id_role WHERE u.email = ?`, [email]
    );

    if (!rows.length) {
      await pool.query(
        `INSERT INTO journal_connexion (email, succes, adresse_ip, message_erreur) VALUES (?,0,?,?)`,
        [email, req.ip, 'Email inconnu']
      );
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const u = rows[0];
    if (!u.statut)          return res.status(403).json({ message: 'Compte désactivé.' });
    if (u.compte_verrouille) return res.status(403).json({ message: 'Compte verrouillé. Contactez un administrateur.' });

    const ok = await bcrypt.compare(mot_de_passe, u.mot_de_passe);
    if (!ok) {
      const t = u.tentative_connexion + 1;
      const v = t >= 5 ? 1 : 0;
      await pool.query(
        `UPDATE utilisateur SET tentative_connexion=?, compte_verrouille=?, date_derniere_tentative=NOW() WHERE id_utilisateur=?`,
        [t, v, u.id_utilisateur]
      );
      await pool.query(
        `INSERT INTO journal_connexion (id_utilisateur, email, succes, adresse_ip, message_erreur) VALUES (?,?,0,?,?)`,
        [u.id_utilisateur, email, req.ip, `Tentative ${t}/5`]
      );
      return res.status(401).json({
        message: v ? 'Compte verrouillé après 5 tentatives.' : `Mot de passe incorrect (${t}/5 tentatives).`
      });
    }

    // ✅ succès
    await pool.query(
      `UPDATE utilisateur SET tentative_connexion=0, compte_verrouille=0, date_derniere_connexion=NOW() WHERE id_utilisateur=?`,
      [u.id_utilisateur]
    );
    await pool.query(
      `INSERT INTO journal_connexion (id_utilisateur, email, succes, adresse_ip) VALUES (?,?,1,?)`,
      [u.id_utilisateur, email, req.ip]
    );
    await pool.query(
      `INSERT INTO journal_audit (id_utilisateur, type_action, action, adresse_ip) VALUES (?,'LOGIN','Connexion réussie',?)`,
      [u.id_utilisateur, req.ip]
    );

    const token = jwt.sign(
      { id: u.id_utilisateur, email: u.email, nom: u.nom, prenom: u.prenom, role: u.nom_role, id_role: u.id_role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await pool.query(
      `INSERT INTO session_utilisateur (id_utilisateur, token, adresse_ip, date_expiration) VALUES (?,?,?,?)`,
      [u.id_utilisateur, token, req.ip, new Date(Date.now() + 8 * 3600000)]
    );

    res.json({ token, user: { id: u.id_utilisateur, nom: u.nom, prenom: u.prenom, email: u.email, role: u.nom_role } });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur.' }); }
});

/* ── LOGOUT ─────────────────────────────────── */
router.post('/logout', auth, async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  try {
    await pool.query(`UPDATE session_utilisateur SET statut='EXPIRE' WHERE token=?`, [token]);
    await pool.query(
      `INSERT INTO journal_audit (id_utilisateur, type_action, action, adresse_ip) VALUES (?,'LOGIN','Déconnexion',?)`,
      [req.user.id, req.ip]
    );
    res.json({ message: 'Déconnexion réussie.' });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

/* ── ME ─────────────────────────────────────── */
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.date_derniere_connexion, r.nom_role
       FROM utilisateur u JOIN role r ON u.id_role=r.id_role WHERE u.id_utilisateur=?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

/* ── MES PERMISSIONS ────────────────────────── */
router.get('/mes-permissions', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.nom_permission FROM role_permission rp
       JOIN permission p ON rp.id_permission=p.id_permission WHERE rp.id_role=?`,
      [req.user.id_role]
    );
    res.json({ permissions: rows.map(r => r.nom_permission) });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

module.exports = router;
