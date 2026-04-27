import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook qui charge les notifications toutes les 60 secondes
 * et expose { notifications, total, refresh, loading }
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data.notifications);
      setTotal(r.data.total);
    } catch {
      // silencieux si non connecté encore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // refresh auto toutes les 60s
    return () => clearInterval(interval);
  }, [refresh]);

  return { notifications, total, refresh, loading };
}
