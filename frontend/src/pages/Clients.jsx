import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './shared.css';

const EMPTY = {
  nom:'', prenom:'', sexe:'M', date_naissance:'', adresse:'',
  telephone:'', email:'', profession:'', revenu_mensuel:'',
  piece_identite:'', numero_identite:'', statut:'ACTIF'
};

export default function Clients() {
  const [rows,   setRows]   = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [busy,   setBusy]   = useState(true);
  const [modal,  setModal]  = useState(false);
  const [sel,    setSel]    = useState(null);
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const limit = 10;

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await api.get('/clients', { params: { search, page, limit } });
      setRows(r.data.data);
      setTotal(r.data.total);
    } catch {}
    finally { setBusy(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew  = () => { setSel(null); setForm(EMPTY); setErr(''); setModal(true); };
  const openEdit = c  => { setSel(c); setForm({ ...c, revenu_mensuel: c.revenu_mensuel || '' }); setErr(''); setModal(true); };
  const close    = () => { setModal(false); setErr(''); };

  const save = async () => {
    if (!form.nom || !form.prenom) return setErr('Nom et prénom sont obligatoires.');
    setSaving(true); setErr('');
    try {
      if (sel) {
        await api.put(`/clients/${sel.id_client}`, form);
      } else {
        await api.post('/clients', form);
      }
      close(); load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  const supprimer = async (c) => {
    if (!window.confirm(`Supprimer ${c.prenom} ${c.nom} ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/clients/${c.id_client}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Impossible de supprimer ce client.');
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="page">
      {/* En-tête */}
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-sub">{total} client{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-p" onClick={openNew}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau Client
        </button>
      </div>

      {/* Recherche */}
      <div className="searchbar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          placeholder="Rechercher par nom, téléphone, email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Tableau */}
      <div className="tbl-card">
        {busy
          ? <div className="tbl-load"><div className="spin" /></div>
          : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Téléphone</th><th>Email</th>
                  <th>Profession</th><th>Statut</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!rows.length
                  ? <tr><td colSpan={6} className="empty-cell">Aucun client trouvé</td></tr>
                  : rows.map(c => (
                      <tr key={c.id_client}>
                        <td>
                          <div className="cli-cell">
                            <div className="cli-av">{c.prenom?.[0]}{c.nom?.[0]}</div>
                            <div>
                              <div className="cli-name">{c.prenom} {c.nom}</div>
                              <div className="cli-meta">{c.sexe === 'M' ? 'Masculin' : c.sexe === 'F' ? 'Féminin' : '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td-muted">{c.telephone || '—'}</td>
                        <td className="td-muted">{c.email || '—'}</td>
                        <td>{c.profession || '—'}</td>
                        <td>
                          <span className={`badge ${c.statut === 'ACTIF' ? 'bg-ok' : 'bg-danger'}`}>
                            {c.statut}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-ic" onClick={() => openEdit(c)} title="Modifier">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button className="btn-ic btn-ic--r" onClick={() => supprimer(c)} title="Supprimer">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14H6L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          )
        }

        {/* Pagination */}
        {pages > 1 && (
          <div className="pager">
            <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
            {[...Array(pages)].map((_, i) => (
              <button
                key={i}
                className={`pg-btn${page === i + 1 ? ' pg-btn--on' : ''}`}
                onClick={() => setPage(i + 1)}
              >{i + 1}</button>
            ))}
            <button className="pg-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>

      {/* Modal Créer / Modifier */}
      {modal && (
        <div className="overlay" onClick={close}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>{sel ? 'Modifier le client' : 'Nouveau client'}</h2>
              <button className="modal-close" onClick={close}>✕</button>
            </div>

            {err && <div className="f-error">{err}</div>}

            <div className="fgrid">
              <div className="fg">
                <label>Prénom *</label>
                <input value={form.prenom} onChange={e => f('prenom', e.target.value)} placeholder="Prénom" />
              </div>
              <div className="fg">
                <label>Nom *</label>
                <input value={form.nom} onChange={e => f('nom', e.target.value)} placeholder="Nom" />
              </div>
              <div className="fg">
                <label>Sexe</label>
                <select value={form.sexe} onChange={e => f('sexe', e.target.value)}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="fg">
                <label>Date de naissance</label>
                <input type="date" value={form.date_naissance || ''} onChange={e => f('date_naissance', e.target.value)} />
              </div>
              <div className="fg">
                <label>Téléphone</label>
                <input value={form.telephone || ''} onChange={e => f('telephone', e.target.value)} placeholder="+261 XX XX XXX XX" />
              </div>
              <div className="fg">
                <label>Email</label>
                <input type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} placeholder="email@exemple.com" />
              </div>
              <div className="fg">
                <label>Profession</label>
                <input value={form.profession || ''} onChange={e => f('profession', e.target.value)} />
              </div>
              <div className="fg">
                <label>Revenu mensuel (Ar)</label>
                <input type="number" value={form.revenu_mensuel || ''} onChange={e => f('revenu_mensuel', e.target.value)} placeholder="0" />
              </div>
              <div className="fg fg--full">
                <label>Adresse</label>
                <textarea rows={2} value={form.adresse || ''} onChange={e => f('adresse', e.target.value)} placeholder="Adresse complète" />
              </div>
              <div className="fg">
                <label>Pièce d'identité</label>
                <input value={form.piece_identite || ''} onChange={e => f('piece_identite', e.target.value)} placeholder="CIN, Passeport…" />
              </div>
              <div className="fg">
                <label>Numéro d'identité</label>
                <input value={form.numero_identite || ''} onChange={e => f('numero_identite', e.target.value)} />
              </div>
              <div className="fg">
                <label>Statut</label>
                <select value={form.statut} onChange={e => f('statut', e.target.value)}>
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              </div>
            </div>

            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button className="btn-p" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement…' : sel ? 'Enregistrer les modifications' : 'Créer le client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
