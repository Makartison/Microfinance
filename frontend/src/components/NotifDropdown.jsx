import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import './NotifDropdown.css';

const ICONS = {
  danger:  { emoji: '🔴', cls: 'nd-danger'  },
  warning: { emoji: '🟡', cls: 'nd-warning' },
  info:    { emoji: '🔵', cls: 'nd-info'    },
  success: { emoji: '🟢', cls: 'nd-success' },
};

export default function NotifDropdown() {
  const { notifications, total, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Fermer si clic dehors
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (lien) => { setOpen(false); navigate(lien); };

  return (
    <div className="nd-wrap" ref={ref}>
      <button className="tb-btn nd-trigger" onClick={() => { setOpen(o => !o); refresh(); }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#64748B" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {total > 0 && <span className="tb-badge">{total > 9 ? '9+' : total}</span>}
      </button>

      {open && (
        <div className="nd-panel">
          <div className="nd-head">
            <span className="nd-title">Notifications</span>
            {total > 0 && <span className="nd-count">{total} nouvelles</span>}
          </div>

          <div className="nd-list">
            {!notifications.length
              ? <div className="nd-empty">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <p>Aucune notification</p>
                </div>
              : notifications.map(n => (
                  <div key={n.id} className={`nd-item ${ICONS[n.type]?.cls}`} onClick={() => go(n.lien)}>
                    <span className="nd-emoji">{ICONS[n.type]?.emoji}</span>
                    <span className="nd-msg">{n.message}</span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                ))
            }
          </div>

          <div className="nd-foot">
            <button onClick={() => { setOpen(false); navigate('/dashboard/parametres'); }}>
              Voir le journal d'audit →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
