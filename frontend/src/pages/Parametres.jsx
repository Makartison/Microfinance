import { useState, useEffect } from 'react';
import api from '../services/api';
import './shared.css';

const TABS = ['Frais & Tarifs', 'Journal d\'Audit', 'Connexions'];

const EMPTY_FRAIS = { nom_frais:'', montant:'', type:'FIXE', actif:1 };

export default function Parametres() {
  const [tab,      setTab]      = useState(0);
  const [frais,    setFrais]    = useState([]);
  const [audit,    setAudit]    = useState([]);
  const [conns,    setConns]    = useState([]);
  const [busy,     setBusy]     = useState(false);
  const [modal,    setModal]    = useState(false);
  const [sel,      setSel]      = useState(null);
  const [form,     setForm]     = useState(EMPTY_FRAIS);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const [pgAudit,  setPgAudit]  = useState(1);
  const [totalAudit,setTotalAudit]=useState(0);

  useEffect(() => { loadTab(); }, [tab, pgAudit]);

  const loadTab = async () => {
    setBusy(true);
    try {
      if (tab===0) { const r=await api.get('/parametres/frais'); setFrais(r.data); }
      if (tab===1) { const r=await api.get('/parametres/audit',{params:{page:pgAudit,limit:20}}); setAudit(r.data.data); setTotalAudit(r.data.total); }
      if (tab===2) { const r=await api.get('/parametres/connexions'); setConns(r.data); }
    } catch {} finally { setBusy(false); }
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const close = () => { setModal(false); setErr(''); };

  const openNew  = () => { setSel(null); setForm(EMPTY_FRAIS); setErr(''); setModal(true); };
  const openEdit = x  => { setSel(x); setForm({nom_frais:x.nom_frais,montant:x.montant,type:x.type,actif:x.actif}); setErr(''); setModal(true); };

  const save = async () => {
    if (!form.nom_frais||!form.montant) return setErr('Nom et montant requis.');
    setSaving(true); setErr('');
    try {
      sel ? await api.put(`/parametres/frais/${sel.id_frais}`,form) : await api.post('/parametres/frais',form);
      close(); loadTab();
    } catch (e) { setErr(e.response?.data?.message||'Erreur.'); }
    finally { setSaving(false); }
  };

  const supp = async (id) => {
    if (!window.confirm('Supprimer ce frais ?')) return;
    try { await api.delete(`/parametres/frais/${id}`); loadTab(); }
    catch {}
  };

  const TYPE_A = { LOGIN:'🔑', TRANSACTION:'↔️', CREDIT:'💰', MODIFICATION:'✏️' };

  const pagesAudit = Math.ceil(totalAudit/20);

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1 className="page-title">Paramètres</h1><p className="page-sub">Configuration et journaux du système</p></div>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:0,borderBottom:'2px solid #E2E8F0'}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>{ setTab(i); setPgAudit(1); }}
            style={{background:'none',border:'none',cursor:'pointer',padding:'12px 22px',fontSize:'.9rem',fontWeight:700,color:tab===i?'#2563EB':'#64748B',borderBottom:tab===i?'2px solid #2563EB':'2px solid transparent',marginBottom:-2,transition:'color .15s'}}>
            {t}
          </button>
        ))}
      </div>

      {busy && <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spin"/></div>}

      {/* ── Tab 0 : Frais ── */}
      {!busy && tab===0 && (
        <>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn-p" onClick={openNew}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nouveau Frais
            </button>
          </div>
          <div className="tbl-card">
            <table className="tbl">
              <thead><tr><th>Nom</th><th>Montant</th><th>Type</th><th>Actif</th><th>Actions</th></tr></thead>
              <tbody>
                {!frais.length
                  ? <tr><td colSpan={5} className="empty-cell">Aucun frais configuré</td></tr>
                  : frais.map(x=>(
                      <tr key={x.id_frais}>
                        <td><b>{x.nom_frais}</b></td>
                        <td>{Number(x.montant).toLocaleString('fr-FR')} {x.type==='FIXE'?'Ar':'%'}</td>
                        <td><span className={`badge ${x.type==='FIXE'?'bg-info':'bg-warn'}`}>{x.type}</span></td>
                        <td><span className={`badge ${x.actif?'bg-ok':'bg-danger'}`}>{x.actif?'Oui':'Non'}</span></td>
                        <td>
                          <div style={{display:'flex',gap:6}}>
                            <button className="btn-ic" onClick={()=>openEdit(x)}>✏️</button>
                            <button className="btn-ic btn-ic--r" onClick={()=>supp(x.id_frais)}>
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Tab 1 : Journal Audit ── */}
      {!busy && tab===1 && (
        <div className="tbl-card">
          <table className="tbl">
            <thead><tr><th>Type</th><th>Action</th><th>Utilisateur</th><th>IP</th><th>Date</th><th>Détails</th></tr></thead>
            <tbody>
              {!audit.length
                ? <tr><td colSpan={6} className="empty-cell">Aucune entrée</td></tr>
                : audit.map(a=>(
                    <tr key={a.id_log}>
                      <td><span className="badge bg-info">{TYPE_A[a.type_action]||''} {a.type_action}</span></td>
                      <td>{a.action}</td>
                      <td>{a.utilisateur_nom||<span className="td-muted">—</span>}</td>
                      <td className="td-muted">{a.adresse_ip||'—'}</td>
                      <td className="td-muted">{new Date(a.date_action).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                      <td>
                        {a.details && (
                          <button style={{background:'none',border:'none',cursor:'pointer',color:'#2563EB',fontSize:'.8rem',fontWeight:700}}
                            onClick={()=>alert(JSON.stringify(JSON.parse(a.details),null,2))}>
                            Voir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          <div className="pager">
            <button className="pg-btn" disabled={pgAudit===1} onClick={()=>setPgAudit(p=>p-1)}>← Précédent</button>
            <span className="pg-info">Page {pgAudit} / {pagesAudit||1}</span>
            <button className="pg-btn" disabled={pgAudit>=pagesAudit} onClick={()=>setPgAudit(p=>p+1)}>Suivant →</button>
          </div>
        </div>
      )}

      {/* ── Tab 2 : Connexions ── */}
      {!busy && tab===2 && (
        <div className="tbl-card">
          <table className="tbl">
            <thead><tr><th>Utilisateur</th><th>Email</th><th>Résultat</th><th>IP</th><th>Date</th><th>Info</th></tr></thead>
            <tbody>
              {!conns.length
                ? <tr><td colSpan={6} className="empty-cell">Aucune connexion</td></tr>
                : conns.map(c=>(
                    <tr key={c.id_log}>
                      <td>{c.utilisateur_nom||<span className="td-muted">Inconnu</span>}</td>
                      <td className="td-muted">{c.email||'—'}</td>
                      <td><span className={`badge ${c.succes?'bg-ok':'bg-danger'}`}>{c.succes?'✅ Succès':'❌ Échec'}</span></td>
                      <td className="td-muted">{c.adresse_ip||'—'}</td>
                      <td className="td-muted">{new Date(c.date_connexion).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                      <td className="td-muted" style={{fontSize:'.8rem'}}>{c.message_erreur||'—'}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Frais */}
      {modal && (
        <div className="overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>{sel?'Modifier le frais':'Nouveau frais'}</h2>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            {err && <div className="f-error">{err}</div>}
            <div className="fgrid">
              <div className="fg fg--full"><label>Nom *</label><input value={form.nom_frais} onChange={e=>f('nom_frais',e.target.value)} placeholder="Ex: Frais de dossier"/></div>
              <div className="fg"><label>Montant *</label><input type="number" value={form.montant} onChange={e=>f('montant',e.target.value)}/></div>
              <div className="fg"><label>Type *</label>
                <select value={form.type} onChange={e=>f('type',e.target.value)}>
                  <option value="FIXE">Fixe (Ar)</option>
                  <option value="POURCENTAGE">Pourcentage (%)</option>
                </select>
              </div>
              <div className="fg"><label>Actif</label>
                <select value={form.actif} onChange={e=>f('actif',+e.target.value)}>
                  <option value={1}>Oui</option><option value={0}>Non</option>
                </select>
              </div>
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button className="btn-p" onClick={save} disabled={saving}>{saving?'…':sel?'Enregistrer':'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
