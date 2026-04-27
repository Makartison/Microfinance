import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotifDropdown from './NotifDropdown';
import './Layout.css';

const NAV = [
  { to:'/dashboard',             icon:'🏠', label:'Tableau de Bord',  perm:null },
  { to:'/dashboard/clients',     icon:'👤', label:'Clients',          perm:'GERER_CLIENTS' },
  { to:'/dashboard/groupes',     icon:'👥', label:'Groupes',          perm:'GERER_CLIENTS' },
  { to:'/dashboard/comptes',     icon:'🗂️',  label:'Comptes',          perm:'GERER_COMPTES' },
  { to:'/dashboard/prets',       icon:'📁', label:'Prêts',            perm:'GERER_PRETS' },
  { to:'/dashboard/epargnes',    icon:'🐷', label:'Épargnes',         perm:'GERER_COMPTES' },
  { to:'/dashboard/transactions',icon:'↔️',  label:'Transactions',     perm:'FAIRE_TRANSACTIONS' },
  { to:'/dashboard/rapports',    icon:'📊', label:'Rapports',         perm:'VOIR_RAPPORTS' },
  { to:'/dashboard/utilisateurs',icon:'🔐', label:'Utilisateurs',     perm:'GERER_UTILISATEURS' },
  { to:'/dashboard/parametres',  icon:'⚙️',  label:'Paramètres',       perm:'GERER_PARAMETRES' },
];

export default function Layout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sb-logo">
          <svg viewBox="0 0 34 34" width="32" height="32">
            <rect width="34" height="34" rx="9" fill="#1E40AF"/>
            <path d="M7 25 L11 18 L15 22 L20 14 L24 18 L28 10" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="7" y="7" width="8" height="8" rx="2" fill="#60A5FA" opacity=".8"/>
          </svg>
          <div>
            <div className="sb-logo-name">Gestion</div>
            <div className="sb-logo-sub">Microfinance</div>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV.filter(n => !n.perm || can(n.perm)).map(item => (
            <NavLink key={item.to} to={item.to} end={item.to==='/dashboard'}
              className={({isActive})=>`sb-item${isActive?' sb-item--on':''}`}>
              <span className="sb-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sb-user">
          <div className="sb-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className="sb-info">
            <div className="sb-name">{user?.prenom} {user?.nom}</div>
            <div className="sb-role">{user?.role||user?.nom_role}</div>
          </div>
          <button className="sb-logout" onClick={async()=>{ await logout(); navigate('/login'); }} title="Déconnexion">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div className="tb-search">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Rechercher un client, prêt, transaction…"/>
          </div>
          <div className="tb-right">
            <NotifDropdown />
            <div className="tb-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          </div>
        </header>
        <main className="page-wrap"><Outlet /></main>
      </div>
    </div>
  );
}
