import { useState, useEffect } from 'react';
import api from '../services/api';
import './shared.css';

const fmtM = (v, coef) => `${coef===-1?'−':'+'} ${Number(Math.abs(v)).toLocaleString('fr-FR')} Ar`;

export default function Transactions() {
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [comptes, setComptes] = useState([]);
  const [busy,    setBusy]    = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ id_compte:'', id_type:'1', montant:'', description:'' });
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const TYPES = [
    {id:'1',label:'Dépôt'},
    {id:'2',label:'Retrait'},
    {id:'3',label:'Remboursement'},
    {id:'4',label:'Frais'},
  ];

  const load = async () => {
    setBusy(true);
    try {
      const r = await api.get('/transactions',{params:{page,limit:20}});
      setRows(r.data.data); setTotal(r.data.total);
    } catch { } finally { setBusy(false); }
  };

  useEffect(()=>{ load(); }, [page]);
  useEffect(()=>{ api.get('/comptes').then(r=>setComptes(r.data)).catch(()=>{}); },[]);

  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const close = () => { setModal(false); setErr(''); };

  const save = async () => {
    if (!form.id_compte||!form.montant) return setErr('Compte et montant requis.');
    if (+form.montant<=0) return setErr('Le montant doit être supérieur à 0.');
    setSaving(true); setErr('');
    try {
      await api.post('/transactions',{
        id_compte: +form.id_compte, id_type: +form.id_type,
        montant: +form.montant, description: form.description||null,
      });
      close(); setPage(1); load();
    } catch (e) { setErr(e.response?.data?.message||'Erreur.'); }
    finally { setSaving(false); }
  };

  const pages = Math.ceil(total/20);

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1 className="page-title">Transactions</h1><p className="page-sub">Historique des mouvements de fonds</p></div>
        <button className="btn-p" onClick={()=>{ setForm({id_compte:'',id_type:'1',montant:'',description:''}); setErr(''); setModal(true); }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle Transaction
        </button>
      </div>

      <div className="tbl-card">
        {busy ? <div className="tbl-load"><div className="spin"/></div>
        : <table className="tbl">
            <thead><tr><th>#</th><th>Client</th><th>Compte</th><th>Type</th><th>Montant</th><th>Date</th><th>Statut</th></tr></thead>
            <tbody>
              {!rows.length
                ? <tr><td colSpan={7} className="empty-cell">Aucune transaction</td></tr>
                : rows.map(t=>(
                    <tr key={t.id_transaction}>
                      <td className="td-muted">#{t.id_transaction}</td>
                      <td><b>{t.client_nom}</b></td>
                      <td><span className="code">{t.numero_compte}</span></td>
                      <td>{t.nom_type}</td>
                      <td className={t.coefficient===1?'td-green':'td-red'}><b>{fmtM(t.montant,t.coefficient)}</b></td>
                      <td className="td-muted">
                        {new Date(t.date_transaction).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                      </td>
                      <td>
                        <span className={`badge ${t.statut==='SUCCES'?'bg-ok':t.statut==='ANNULE'?'bg-danger':'bg-warn'}`}>{t.statut}</span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        }
        <div className="pager">
          <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Précédent</button>
          <span className="pg-info">Page {page} / {pages||1}</span>
          <button className="pg-btn" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Suivant →</button>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><h2>Nouvelle Transaction</h2><button className="modal-close" onClick={close}>✕</button></div>
            {err && <div className="f-error">{err}</div>}
            <div className="fgrid">
              <div className="fg fg--full"><label>Compte *</label>
                <select value={form.id_compte} onChange={e=>f('id_compte',e.target.value)}>
                  <option value="">— Sélectionner un compte —</option>
                  {comptes.map(c=>(
                    <option key={c.id_compte} value={c.id_compte}>
                      {c.numero_compte} — {c.client_nom} ({c.type_compte}) — {Number(c.solde).toLocaleString('fr-FR')} Ar
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg"><label>Type *</label>
                <select value={form.id_type} onChange={e=>f('id_type',e.target.value)}>
                  {TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="fg"><label>Montant (Ar) *</label>
                <input type="number" min="1" value={form.montant} onChange={e=>f('montant',e.target.value)} placeholder="0"/>
              </div>
              <div className="fg fg--full"><label>Description</label>
                <input value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Libellé (optionnel)"/>
              </div>
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button className="btn-p" onClick={save} disabled={saving}>{saving?'Traitement…':'Valider'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
