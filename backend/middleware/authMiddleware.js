const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'Token manquant. Veuillez vous connecter.' });
  const token = header.split(' ')[1];
  if (!token)  return res.status(401).json({ message: 'Format de token invalide.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: 'Session expirée. Veuillez vous reconnecter.' });
  }
};
