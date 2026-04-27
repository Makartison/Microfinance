import { useState, useEffect } from 'react';
import api from '../services/api';
import './shared.css';

export default function Groupes() {
  const [groupes,  setGroupes]  = useState([]);
  const [clients,  setClients]  = useState([]);
  const [busy,     setBusy]     = useState(true);
  const [modal,    setModal]    = useState(false);       // création/édition groupe
  const [modalM,   setModalM]   = useState(null);        // gestion membres (id_groupe)
  const [sel,      setSel]      = useState(null);
  const [membres,  setMembres]  = useState([]);
  const [form,     setForm]     = useState({ nom_groupe:'' });
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const [newMembre,setNewMembre]= useState('');

  const load = async () => {
    setBusy(true);
    try { const r = await api.get('/groupes'); setGroupes(r.data); }
    catch {} finally { setBusy(false); }
  };

  useEffect(() => {
    load();
    api.get('/clients',{params:{limit:500}}).then(r=>setClients(r.data.data)).catch(()=>{});
  }, []);

  const openNew  = () => { setSel(null); setForm({nom_groupe:''}); setErr(''); setModal(true); };
  const openEdit = g  => { setSel(g);   setForm({nom_groupe:g.nom_groupe}); setErr(''); setModal(true); };
  const close    = () => { setModal(false); setErr(''); };

  const openMembres = async (g) => {
    setModalM(g);
    try {
      const r = await api.get(`/groupes/${g.id_groupe}`);
      setMembres(r.data.membres||[]);
    } catch {}
  };

  const save = async () => {
    if (!form.nom_groupe) return setErr('Nom du groupe requis.');
    setSaving(true); setErr('');
    try {
      sel ? await api.put(`/groupes/${sel.id_groupe}`, form) : await api.post('/groupes', form);
      close(); load();
    } catch (e) { setErr(e.response?.data?.message||'Erreur.'); }
    finally { setSaving(false); }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ce groupe ?')) return;
    try { await api.delete(`/groupes/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message||'Erreur.'); }
  };

  const ajouterMembre = async () => {
    if (!newMembre) return;
    try {
      await api.post(`/groupes/${modalM.id_groupe}/membres`, { id_client: +newMembre });
      const r = await api.get(`/groupes/${modalM.id_groupe}`);
      setMembres(r.data.membres||[]);
      setNewMembre('');
      load();
    } catch (e) { alert(e.response?.data?.message||'Erreur.'); }
  };

  const retirerMembre = async (id_client) => {
    try {
      await api.delete(`/groupes/${modalM.id_groupe}/membres/${id_client}`);
      setMembres(m => m.filter(x => x.id_client !== id_client));
      load();
    } catch {}
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Groupes de Clients</h1>
          <p className="page-sub">{groupes.length} groupe{groupes.length>1?'s':''}</p>
        </div>
        <button className="btn-p" onClick={openNew}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau Groupe
        </button>
      </div>

      <div className="tbl-card">
        {busy ? <div className="tbl-load"><div className="spin"/></div>
        : <table className="tbl">
            <thead><tr><th>Nom du Groupe</th><th>Membres</th><th>Créé le</th><th>Actions</th></tr></thead>
            <tbody>
              {!groupes.length
                ? <tr><td colSpan={4} className="empty-cell">Aucun groupe</td></tr>
                : groupes.map(g => (
                    <tr key={g.id_groupe}>
                      <td><b>{g.nom_groupe}</b></td>
                      <td>
                        <span className="badge bg-info">{g.nb_membres} membre{g.nb_membres>1?'s':''}</span>
                      </td>
                      <td className="td-muted">{new Date(g.date_creation).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn-ic" onClick={()=>openMembres(g)} title="Gérer membres">👥</button>
                          <button className="btn-ic" onClick={()=>openEdit(g)} title="Modifier">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-ic btn-ic--r" onClick={()=>supprimer(g.id_groupe)} title="Supprimer">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        }
      </div>

      {/* Modal créer/éditer groupe */}
      {modal && (
        <div className="overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>{sel?'Modifier le groupe':'Nouveau groupe'}</h2>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            {err && <div className="f-error">{err}</div>}
            <div className="fgrid">
              <div className="fg fg--full">
                <label>Nom du groupe *</label>
                <input value={form.nom_groupe} onChange={e=>setForm({nom_groupe:e.target.value})} placeholder="Ex: Groupe Solidarité Nord"/>
              </div>
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button className="btn-p" onClick={save} disabled={saving}>{saving?'…':sel?'Enregistrer':'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gestion membres */}
      {modalM && (
        <div className="overlay" onClick={()=>setModalM(null)}>
          <div className="modal modal--lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>Membres — {modalM.nom_groupe}</h2>
              <button className="modal-close" onClick={()=>setModalM(null)}>✕</button>
            </div>

            {/* Ajouter un membre */}
            <div style={{padding:'0 26px 16px',display:'flex',gap:10,alignItems:'flex-end'}}>
              <div className="fg" style={{flex:1}}>
                <label>Ajouter un client</label>
                <select value={newMembre} onChange={e=>setNewMembre(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {clients.filter(c=>!membres.find(m=>m.id_client===c.id_client)).map(c=>(
                    <option key={c.id_client} value={c.id_client}>{c.prenom} {c.nom}</option>
                  ))}
                </select>
              </div>
              <button className="btn-p" onClick={ajouterMembre} style={{whiteSpace:'nowrap'}}>+ Ajouter</button>
            </div>

            {/* Liste membres */}
            <div style={{padding:'0 26px',maxHeight:300,overflowY:'auto'}}>
              {!membres.length
                ? <p style={{color:'#94A3B8',textAlign:'center',padding:'24px 0',fontSize:'.88rem'}}>Aucun membre dans ce groupe</p>
                : membres.map(m=>(
                    <div key={m.id_client} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #F1F5F9'}}>
                      <div className="cli-av">{m.prenom?.[0]}{m.nom?.[0]}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,color:'#1E293B'}}>{m.prenom} {m.nom}</div>
                        <div style={{fontSize:'.75rem',color:'#94A3B8'}}>{m.telephone||m.email||'—'}</div>
                      </div>
                      <button className="btn-ic btn-ic--r" onClick={()=>retirerMembre(m.id_client)} title="Retirer">✕</button>
                    </div>
                  ))
              }
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={()=>setModalM(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
