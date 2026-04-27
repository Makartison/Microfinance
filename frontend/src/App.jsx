/* src/App.jsx — FINAL avec Epargnes + Rapports */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Home         from './pages/Home';
import Login        from './pages/Login';
import Layout       from './components/Layout';
import Dashboard    from './pages/Dashboard';
import Clients      from './pages/Clients';
import Groupes      from './pages/Groupes';
import Comptes      from './pages/Comptes';
import Prets        from './pages/Prets';
import Epargnes     from './pages/Epargnes';      // ← NOUVEAU
import Transactions from './pages/Transactions';
import Rapports     from './pages/Rapports';       // ← NOUVEAU
import Utilisateurs from './pages/Utilisateurs';
import Parametres   from './pages/Parametres';

const Spinner = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
    <div style={{width:40,height:40,border:'4px solid #E2E8F0',borderTopColor:'#2563EB',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Home />;
};

const LoginRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Guard = ({ permission, children }) => {
  const { can } = useAuth();
  if (!can(permission)) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:14}}>
      <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#EF4444" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{fontSize:'1.1rem',fontWeight:800,color:'#1E293B'}}>Accès refusé</p>
      <p style={{color:'#64748B',fontSize:'.9rem',textAlign:'center'}}>
        Vous n'avez pas la permission d'accéder à cette section.
      </p>
    </div>
  );
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"      element={<HomeRoute  />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index             element={<Dashboard />} />
        <Route path="clients"      element={<Guard permission="GERER_CLIENTS"><Clients /></Guard>} />
        <Route path="groupes"      element={<Guard permission="GERER_CLIENTS"><Groupes /></Guard>} />
        <Route path="comptes"      element={<Guard permission="GERER_COMPTES"><Comptes /></Guard>} />
        <Route path="prets"        element={<Guard permission="GERER_PRETS"><Prets /></Guard>} />
        <Route path="epargnes"     element={<Guard permission="GERER_COMPTES"><Epargnes /></Guard>} />
        <Route path="transactions" element={<Guard permission="FAIRE_TRANSACTIONS"><Transactions /></Guard>} />
        <Route path="rapports"     element={<Guard permission="VOIR_RAPPORTS"><Rapports /></Guard>} />
        <Route path="utilisateurs" element={<Guard permission="GERER_UTILISATEURS"><Utilisateurs /></Guard>} />
        <Route path="parametres"   element={<Guard permission="GERER_PARAMETRES"><Parametres /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
