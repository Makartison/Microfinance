// src/pages/Epargnes.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './shared.css';

const fmt = v => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(v)+' Ar';

export default function Epargnes() {
  const [rows,    setRows]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [busy,    setBusy]    = useState(true);
  const [modal,   setModal]   = useState(null); // 'depot' | 'retrait' | null
  const [selCpte, setSelCpte] = useState(null);
  const [form,    setForm]    = useState({ montant:'', description:'' });
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const limit = 10;

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await api.get('/epargnes', { params:{ page, limit, search } });
      setRows(r.data.data);
      setTotal(r.data.total);
      setStats(r.data.stats);
    } catch {}
    finally { setBusy(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openModal = (type, compte) => {
    setModal(type);
    setSelCpte(compte);
    setForm({ montant:'', description:'' });
    setErr('');
  };
  const close = () => { setModal(null); setErr(''); };

  const save = async () => {
    if (!form.montant || +form.montant <= 0) return setErr('Montant invalide.');
    setSaving(true); setErr('');
    try {
      await api.post(`/epargnes/${modal}`, {
        id_compte: selCpte.id_compte,
        montant:   +form.montant,
        description: form.description || null,
      });
      close(); load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur.');
    } finally { setSaving(false); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="page">
      {/* En-tête */}
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Épargnes</h1>
          <p className="page-sub">{total} compte{total>1?'s':''} épargne</p>
        </div>
      </div>

      {/* Cartes stats */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:8}}>
          {[
            { label:'Total comptes', val: stats.total_comptes, color:'#3B82F6', bg:'#EFF6FF', icon:'🗂️' },
            { label:'Comptes actifs', val: stats.comptes_actifs, color:'#10B981', bg:'#ECFDF5', icon:'✅' },
            { label:'Solde total',    val: fmt(stats.solde_total), color:'#F59E0B', bg:'#FFFBEB', icon:'💰' },
            { label:'Solde moyen',   val: fmt(stats.solde_moyen), color:'#8B5CF6', bg:'#F5F3FF', icon:'📊' },
          ].map((s,i) => (
            <div key={i} style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',borderBottom:`3px solid ${s.color}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:44,height:44,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem'}}>{s.icon}</div>
                <div>
                  <div style={{fontSize:'.75rem',color:'#64748B',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em'}}>{s.label}</div>
                  <div style={{fontSize:'1.1rem',fontWeight:800,color:'#1E293B'}}>{s.val}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recherche */}
      <div className="searchbar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          placeholder="Rechercher par client ou numéro de compte…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Tableau */}
      <div className="tbl-card">
        {busy
          ? <div className="tbl-load"><div className="spin"/></div>
          : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Numéro compte</th>
                  <th>Client</th>
                  <th>Solde actuel</th>
                  <th>Total dépôts</th>
                  <th>Total retraits</th>
                  <th>Opérations</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!rows.length
                  ? <tr><td colSpan={8} className="empty-cell">Aucun compte épargne</td></tr>
                  : rows.map(c => (
                      <tr key={c.id_compte}>
                        <td><span className="code">{c.numero_compte}</span></td>
                        <td>
                          <div className="cli-cell">
                            <div className="cli-av">{c.client_nom?.[0]}{c.client_nom?.split(' ')[1]?.[0]}</div>
                            <div>
                              <div className="cli-name">{c.client_nom}</div>
                              <div className="cli-meta">{c.telephone||'—'}</div>
                            </div>
                          </div>
                        </td>
                        <td><strong style={{color:'#059669'}}>{fmt(c.solde)}</strong></td>
                        <td className="td-green">{fmt(c.total_depots)}</td>
                        <td className="td-red">{fmt(c.total_retraits)}</td>
                        <td className="td-muted">{c.nb_transactions} opération{c.nb_transactions>1?'s':''}</td>
                        <td>
                          <span className={`badge ${c.statut==='ACTIF'?'bg-ok':c.statut==='SUSPENDU'?'bg-warn':'bg-danger'}`}>
                            {c.statut}
                          </span>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:6}}>
                            <button
                              className="btn-ic btn-ic--g"
                              onClick={() => openModal('depot', c)}
                              title="Dépôt"
                              disabled={c.statut !== 'ACTIF'}
                            >+</button>
                            <button
                              className="btn-ic btn-ic--r"
                              onClick={() => openModal('retrait', c)}
                              title="Retrait"
                              disabled={c.statut !== 'ACTIF'}
                            >−</button>
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
            <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button>
            {[...Array(pages)].map((_,i)=>(
              <button key={i} className={`pg-btn${page===i+1?' pg-btn--on':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>
            ))}
            <button className="pg-btn" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>→</button>
          </div>
        )}
      </div>

      {/* Modal Dépôt / Retrait */}
      {modal && selCpte && (
        <div className="overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>
                {modal === 'depot' ? '💰 Dépôt' : '💸 Retrait'} — {selCpte.client_nom}
              </h2>
              <button className="modal-close" onClick={close}>✕</button>
            </div>

            {/* Info compte */}
            <div style={{margin:'0 26px 16px',background:'#F8FAFC',borderRadius:10,padding:'12px 16px',border:'1px solid #E2E8F0'}}>
              <div style={{fontSize:'.78rem',color:'#64748B',marginBottom:4}}>Solde actuel</div>
              <div style={{fontSize:'1.3rem',fontWeight:800,color:'#059669'}}>{fmt(selCpte.solde)}</div>
              <div style={{fontSize:'.78rem',color:'#94A3B8',marginTop:2}}>{selCpte.numero_compte}</div>
            </div>

            {err && <div className="f-error">{err}</div>}

            <div className="fgrid">
              <div className="fg fg--full">
                <label>Montant (Ar) *</label>
                <input
                  type="number" min="1"
                  value={form.montant}
                  onChange={e => setForm(f=>({...f, montant:e.target.value}))}
                  placeholder="Ex : 50000"
                  style={{fontSize:'1.1rem'}}
                />
              </div>
              <div className="fg fg--full">
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f=>({...f, description:e.target.value}))}
                  placeholder={modal==='depot' ? 'Ex : Dépôt mensuel' : 'Ex : Retrait urgent'}
                />
              </div>
            </div>

            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button
                className="btn-p"
                onClick={save}
                disabled={saving}
                style={{background: modal==='depot' ? '#10B981' : '#EF4444'}}
              >
                {saving ? '...' : modal==='depot' ? '✅ Confirmer le dépôt' : '✅ Confirmer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
