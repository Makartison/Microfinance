const pool = require('../db');

/**
 * rbac('GERER_CLIENTS')  →  vérifie la permission en BDD et bloque si absent
 * Toujours placer après auth : router.get('/', auth, rbac('PERMISSION'), handler)
 */
module.exports = (permission) => async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.nom_permission FROM role_permission rp
       JOIN permission p ON rp.id_permission = p.id_permission
       WHERE rp.id_role = ?`,
      [req.user.id_role]
    );
    if (rows.map(r => r.nom_permission).includes(permission)) return next();

    // Log tentative accès non autorisé
    await pool.query(
      `INSERT INTO journal_audit (id_utilisateur, type_action, action, adresse_ip, details)
       VALUES (?, 'MODIFICATION', 'ACCÈS REFUSÉ', ?, ?)`,
      [req.user.id, req.ip, JSON.stringify({ route: req.originalUrl, permission, role: req.user.role })]
    );
    return res.status(403).json({
      message:    `Accès refusé — permission requise : "${permission}"`,
      votre_role: req.user.role,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur vérification droits.' });
  }
};
