const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/authMiddleware');
const rbac    = require('../middleware/rbacMiddleware');

router.get('/', auth, rbac('FAIRE_TRANSACTIONS'), async (req, res) => {
  const { page=1, limit=20 } = req.query;
  const offset = (page-1)*limit;
  try {
    const [data] = await pool.query(
      `SELECT t.id_transaction, tt.nom_type, tt.coefficient, t.montant, t.statut, t.description, t.date_transaction, cp.numero_compte, CONCAT(c.nom,' ',c.prenom) AS client_nom
       FROM transactions t JOIN type_transaction tt ON t.id_type=tt.id_type JOIN compte cp ON t.id_compte=cp.id_compte JOIN client c ON cp.id_client=c.id_client
       ORDER BY t.date_transaction DESC LIMIT ? OFFSET ?`, [+limit,+offset]
    );
    const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM transactions`);
    res.json({ data, total, page:+page, limit:+limit });
  } catch { res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.post('/', auth, rbac('FAIRE_TRANSACTIONS'), async (req, res) => {
  const { id_compte, id_type, montant, description } = req.body;
  if (!id_compte||!id_type||!montant) return res.status(400).json({ message: 'Compte, type et montant requis.' });
  if (+montant <= 0) return res.status(400).json({ message: 'Montant doit être > 0.' });
  try {
    const [[compte]] = await pool.query(`SELECT statut FROM compte WHERE id_compte=?`, [id_compte]);
    if (!compte)                return res.status(404).json({ message: 'Compte introuvable.' });
    if (compte.statut !== 'ACTIF') return res.status(400).json({ message: 'Compte suspendu ou fermé.' });

    const [r] = await pool.query(
      `INSERT INTO transactions (id_compte,id_utilisateur,id_type,montant,description) VALUES (?,?,?,?,?)`,
      [id_compte, req.user.id, id_type, +montant, description||null]
    );
    await pool.query(`INSERT INTO journal_audit (id_utilisateur,type_action,action,adresse_ip,details) VALUES (?,'TRANSACTION','Transaction',?,?)`, [req.user.id,req.ip,JSON.stringify({id:r.insertId,montant})]);
    res.status(201).json({ message: 'Transaction effectuée.', id: r.insertId });
  } catch (e) {
    if (e.sqlMessage?.includes('Solde insuffisant')) return res.status(400).json({ message: 'Solde insuffisant.' });
    if (e.sqlMessage?.includes('Montant invalide'))  return res.status(400).json({ message: 'Montant invalide.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/virement', auth, rbac('FAIRE_TRANSACTIONS'), async (req, res) => {
  const { id_compte_source, id_compte_dest, montant, description } = req.body;
  if (!id_compte_source||!id_compte_dest||!montant) return res.status(400).json({ message: 'Données manquantes.' });
  if (id_compte_source === id_compte_dest) return res.status(400).json({ message: 'Comptes identiques.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`INSERT INTO transactions (id_compte,id_utilisateur,id_type,montant,description) VALUES (?,?,2,?,?)`, [id_compte_source,req.user.id,+montant,description||'Virement sortant']);
    await conn.query(`INSERT INTO transactions (id_compte,id_utilisateur,id_type,montant,description) VALUES (?,?,1,?,?)`, [id_compte_dest,req.user.id,+montant,description||'Virement entrant']);
    await conn.commit();
    res.status(201).json({ message: 'Virement effectué.' });
  } catch (e) {
    await conn.rollback();
    if (e.sqlMessage?.includes('Solde insuffisant')) return res.status(400).json({ message: 'Solde insuffisant.' });
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally { conn.release(); }
});

module.exports = router;
