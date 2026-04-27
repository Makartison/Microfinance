import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [perms,   setPerms]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    Promise.all([api.get('/auth/me'), api.get('/auth/mes-permissions')])
      .then(([u, p]) => {
        setUser(u.data);
        setPerms(p.data.permissions || []);
      })
      .catch(() => { localStorage.removeItem('token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, mot_de_passe) => {
    const res = await api.post('/auth/login', { email, mot_de_passe });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    const p = await api.get('/auth/mes-permissions');
    setPerms(p.data.permissions || []);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    setUser(null);
    setPerms([]);
  };

  const can = (permission) => perms.includes(permission);

  return (
    <Ctx.Provider value={{ user, perms, loading, login, logout, can }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
