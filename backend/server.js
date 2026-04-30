// backend/server.js — FINAL
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',           // Local dev
    'http://localhost:5173',           // Vite frontend dev
    'https://microfinance-xi.vercel.app'  // Production Vercel (remplace par ton vrai domaine)
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/clients',       require('./routes/clients'));
app.use('/api/comptes',       require('./routes/comptes'));
app.use('/api/prets',         require('./routes/prets'));
app.use('/api/transactions',  require('./routes/transactions'));
app.use('/api/epargnes',      require('./routes/epargnes'));      // ← NOUVEAU
app.use('/api/rapports',      require('./routes/rapports'));      // ← NOUVEAU
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/groupes',       require('./routes/groupes'));
app.use('/api/utilisateurs',  require('./routes/utilisateurs'));
app.use('/api/parametres',    require('./routes/parametres'));

app.get('/', (_, res) => res.json({ status: '✅ MicroFinance API v2.0' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
