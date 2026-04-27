import { useState, useEffect } from 'react';
import api from '../services/api';
import './shared.css';

export default function Comptes() {
  const [rows,    setRows]    = useState([]);
  const [clients, setClients] = useState([]);
  const [busy,    setBusy]    = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ id_client:'', type_compte:'EPARGNE', devise:'MGA' });
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const load = async () => {
    setBusy(true);
    try { const r = await api.get('/comptes'); setRows(r.data); }
    catch { } finally { setBusy(false); }
  };

  useEffect(() => {
    load();
    api.get('/clients',{params:{limit:500}}).then(r=>setClients(r.data.data)).catch(()=>{});
  }, []);

  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const close = () => { setModal(false); setErr(''); };

  const save = async () => {
    if (!form.id_client) return setErr('Veuillez sélectionner un client.');
    setSaving(true); setErr('');
    try { await api.post('/comptes', form); close(); load(); }
    catch (e) { setErr(e.response?.data?.message||'Erreur.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Comptes</h1>
          <p className="page-sub">{rows.length} compte{rows.length>1?'s':''}</p>
        </div>
        <button className="btn-p" onClick={()=>{ setForm({id_client:'',type_compte:'EPARGNE',devise:'MGA'}); setErr(''); setModal(true); }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau Compte
        </button>
      </div>

      <div className="tbl-card">
        {busy ? <div className="tbl-load"><div className="spin"/></div>
        : <table className="tbl">
            <thead><tr><th>Numéro</th><th>Client</th><th>Type</th><th>Solde</th><th>Devise</th><th>Statut</th><th>Ouvert le</th></tr></thead>
            <tbody>
              {!rows.length
                ? <tr><td colSpan={7} className="empty-cell">Aucun compte</td></tr>
                : rows.map(c=>(
                    <tr key={c.id_compte}>
                      <td><span className="code">{c.numero_compte}</span></td>
                      <td><b>{c.client_nom}</b></td>
                      <td><span className={`badge ${c.type_compte==='EPARGNE'?'bg-info':'bg-warn'}`}>{c.type_compte}</span></td>
                      <td><b>{Number(c.solde).toLocaleString('fr-FR')} Ar</b></td>
                      <td className="td-muted">{c.devise}</td>
                      <td><span className={`badge ${c.statut==='ACTIF'?'bg-ok':c.statut==='SUSPENDU'?'bg-warn':'bg-danger'}`}>{c.statut}</span></td>
                      <td className="td-muted">{new Date(c.date_creation).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        }
      </div>

      {modal && (
        <div className="overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><h2>Nouveau Compte</h2><button className="modal-close" onClick={close}>✕</button></div>
            {err && <div className="f-error">{err}</div>}
            <div className="fgrid">
              <div className="fg fg--full"><label>Client *</label>
                <select value={form.id_client} onChange={e=>f('id_client',e.target.value)}>
                  <option value="">— Sélectionner un client —</option>
                  {clients.map(c=><option key={c.id_client} value={c.id_client}>{c.prenom} {c.nom} — {c.telephone||c.email||''}</option>)}
                </select>
              </div>
              <div className="fg"><label>Type *</label>
                <select value={form.type_compte} onChange={e=>f('type_compte',e.target.value)}>
                  <option value="EPARGNE">Épargne</option><option value="COURANT">Courant</option>
                </select>
              </div>
              <div className="fg"><label>Devise</label>
                <select value={form.devise} onChange={e=>f('devise',e.target.value)}>
                  <option value="MGA">MGA — Ariary</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — Dollar</option>
                </select>
              </div>
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button className="btn-p" onClick={save} disabled={saving}>{saving?'Création…':'Créer le compte'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
