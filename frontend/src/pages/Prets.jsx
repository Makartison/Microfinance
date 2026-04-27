import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './shared.css';

const fmt = v => Number(v).toLocaleString('fr-FR')+' Ar';

const EMPTY = { id_client:'', montant_capital:'', taux_interet:'', duree:'', frequence_remboursement:'MENSUEL', date_debut:'' };

export default function Prets() {
  const [rows,    setRows]    = useState([]);
  const [clients, setClients] = useState([]);
  const [busy,    setBusy]    = useState(true);
  const [filtre,  setFiltre]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try { const r = await api.get('/prets',{params:{statut:filtre||undefined}}); setRows(r.data); }
    catch { } finally { setBusy(false); }
  }, [filtre]);

  useEffect(()=>{ load(); }, [load]);
  useEffect(()=>{ api.get('/clients',{params:{limit:500}}).then(r=>setClients(r.data.data)).catch(()=>{}); },[]);

  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const close = () => { setModal(false); setErr(''); };

  // Mensualité estimée
  const mensualite = () => {
    const { montant_capital:c, taux_interet:ti, duree:d, frequence_remboursement:fr } = form;
    if (!c||!ti||!d) return null;
    const pa = fr==='MENSUEL'?12:52, r = +ti/100/pa, n = +d;
    const M  = r===0 ? +c/n : +c*r/(1-Math.pow(1+r,-n));
    return isNaN(M)||!isFinite(M)?null:M.toFixed(0);
  };

  const save = async () => {
    const { id_client, montant_capital, taux_interet, duree, frequence_remboursement } = form;
    if (!id_client||!montant_capital||!taux_interet||!duree)
      return setErr('Veuillez remplir tous les champs obligatoires.');
    setSaving(true); setErr('');
    try {
      const r = await api.post('/prets',{
        id_client:+id_client, montant_capital:+montant_capital,
        taux_interet:+taux_interet, duree:+duree,
        frequence_remboursement, date_debut:form.date_debut||null,
      });
      close(); load();
      alert(`✅ ${r.data.message}\nMensualité : ${fmt(r.data.mensualite)}`);
    } catch (e) { setErr(e.response?.data?.message||'Erreur.'); }
    finally { setSaving(false); }
  };

  const decision = async (id, d) => {
    try { await api.patch(`/prets/${id}/decision`,{decision:d}); load(); }
    catch(e){ alert(e.response?.data?.message||'Erreur.'); }
  };

  const StatusBadge = ({ p }) => {
    if (p.decision==='REFUSE')     return <span className="badge bg-danger">Refusé</span>;
    if (p.decision==='EN_ATTENTE') return <span className="badge bg-warn">En Attente</span>;
    if (p.statut==='EN_RETARD')    return <span className="badge bg-danger">En Retard</span>;
    if (p.statut==='REMBOURSE')    return <span className="badge bg-info">Remboursé</span>;
    return <span className="badge bg-ok">En Cours</span>;
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1 className="page-title">Prêts</h1><p className="page-sub">{rows.length} prêt{rows.length>1?'s':''}</p></div>
        <div style={{display:'flex',gap:10}}>
          <select className="sel-filter" value={filtre} onChange={e=>setFiltre(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_RETARD">En retard</option>
            <option value="REMBOURSE">Remboursé</option>
          </select>
          <button className="btn-p" onClick={()=>{ setForm(EMPTY); setErr(''); setModal(true); }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau Prêt
          </button>
        </div>
      </div>

      <div className="tbl-card">
        {busy ? <div className="tbl-load"><div className="spin"/></div>
        : <table className="tbl">
            <thead><tr><th>#</th><th>Client</th><th>Capital</th><th>Taux</th><th>Durée</th><th>Fréquence</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {!rows.length
                ? <tr><td colSpan={8} className="empty-cell">Aucun prêt</td></tr>
                : rows.map(p=>(
                    <tr key={p.id_pret}>
                      <td className="td-muted">#{p.id_pret}</td>
                      <td><b>{p.client_nom}</b></td>
                      <td><b>{fmt(p.montant_capital)}</b></td>
                      <td>{p.taux_interet}%</td>
                      <td>{p.duree} {p.frequence_remboursement==='MENSUEL'?'mois':'sem.'}</td>
                      <td className="td-muted">{p.frequence_remboursement}</td>
                      <td><StatusBadge p={p}/></td>
                      <td>
                        {p.decision==='EN_ATTENTE' && (
                          <div style={{display:'flex',gap:6}}>
                            <button className="btn-ic btn-ic--g" onClick={()=>decision(p.id_pret,'ACCEPTE')} title="Approuver">✓</button>
                            <button className="btn-ic btn-ic--r" onClick={()=>decision(p.id_pret,'REFUSE')}  title="Refuser">✕</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        }
      </div>

      {modal && (
        <div className="overlay" onClick={close}>
          <div className="modal modal--lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><h2>Nouveau Prêt</h2><button className="modal-close" onClick={close}>✕</button></div>
            {err && <div className="f-error">{err}</div>}
            <div className="fgrid">
              <div className="fg fg--full"><label>Client *</label>
                <select value={form.id_client} onChange={e=>f('id_client',e.target.value)}>
                  <option value="">— Sélectionner un client —</option>
                  {clients.map(c=><option key={c.id_client} value={c.id_client}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
              <div className="fg"><label>Montant capital (Ar) *</label><input type="number" value={form.montant_capital} onChange={e=>f('montant_capital',e.target.value)} placeholder="ex: 500000"/></div>
              <div className="fg"><label>Taux annuel (%) *</label><input type="number" step=".01" value={form.taux_interet} onChange={e=>f('taux_interet',e.target.value)} placeholder="ex: 12"/></div>
              <div className="fg"><label>Durée (périodes) *</label><input type="number" value={form.duree} onChange={e=>f('duree',e.target.value)} placeholder="ex: 12"/></div>
              <div className="fg"><label>Fréquence *</label>
                <select value={form.frequence_remboursement} onChange={e=>f('frequence_remboursement',e.target.value)}>
                  <option value="MENSUEL">Mensuel</option><option value="HEBDOMADAIRE">Hebdomadaire</option>
                </select>
              </div>
              <div className="fg"><label>Date de début</label><input type="date" value={form.date_debut} onChange={e=>f('date_debut',e.target.value)}/></div>
            </div>
            {mensualite() && (
              <div className="f-info">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2563EB" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Mensualité estimée : <b>{fmt(mensualite())}</b>
              </div>
            )}
            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button className="btn-p" onClick={save} disabled={saving}>{saving?'Création…':'Créer le prêt + échéancier'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
