import { useState, useEffect } from 'react';
import api from '../services/api';
import './shared.css';

const ROLE_COLORS = {
  ADMIN:       'bg-danger',
  SUPERVISEUR: 'bg-warn',
  AGENT:       'bg-info',
  CAISSIER:    'bg-ok',
};

const ALL_PERMS = [
  { key:'GERER_CLIENTS',      label:'Gérer les clients' },
  { key:'GERER_COMPTES',      label:'Gérer les comptes' },
  { key:'FAIRE_TRANSACTIONS', label:'Faire des transactions' },
  { key:'GERER_PRETS',        label:'Gérer les prêts' },
  { key:'VOIR_RAPPORTS',      label:'Voir les rapports' },
  { key:'GERER_UTILISATEURS', label:'Gérer les utilisateurs' },
  { key:'GERER_PARAMETRES',   label:'Gérer les paramètres' },
];

const EMPTY_FORM = { nom:'', prenom:'', email:'', mot_de_passe:'', id_role:'', statut:1 };

export default function Utilisateurs() {
  const [users,    setUsers]    = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [busy,     setBusy]     = useState(true);
  const [modal,    setModal]    = useState(false);
  const [modalRole,setModalRole]= useState(null);   // édition permissions rôle
  const [modalPwd, setModalPwd] = useState(null);   // changement mdp
  const [sel,      setSel]      = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [newPwd,   setNewPwd]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const [permsEdit,setPermsEdit]= useState([]);     // permissions en cours d'édition

  const load = async () => {
    setBusy(true);
    try {
      const [u,r] = await Promise.all([api.get('/utilisateurs'), api.get('/utilisateurs/roles/liste')]);
      setUsers(u.data); setRoles(r.data);
    } catch {} finally { setBusy(false); }
  };

  useEffect(() => { load(); }, []);

  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const close = () => { setModal(false); setErr(''); };

  const openNew  = () => { setSel(null); setForm(EMPTY_FORM); setErr(''); setModal(true); };
  const openEdit = u => { setSel(u); setForm({nom:u.nom,prenom:u.prenom,email:u.email,mot_de_passe:'',id_role:u.id_role,statut:u.statut}); setErr(''); setModal(true); };

  const save = async () => {
    const { nom, prenom, email, mot_de_passe, id_role } = form;
    if (!nom||!prenom||!email||!id_role) return setErr('Tous les champs obligatoires.');
    if (!sel && !mot_de_passe) return setErr('Mot de passe requis pour la création.');
    setSaving(true); setErr('');
    try {
      if (sel) {
        await api.put(`/utilisateurs/${sel.id_utilisateur}`, form);
        if (mot_de_passe) await api.patch(`/utilisateurs/${sel.id_utilisateur}/mot-de-passe`,{nouveau_mot_de_passe:mot_de_passe});
      } else {
        await api.post('/utilisateurs', form);
      }
      close(); load();
    } catch (e) { setErr(e.response?.data?.message||'Erreur.'); }
    finally { setSaving(false); }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur définitivement ?')) return;
    try { await api.delete(`/utilisateurs/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message||'Erreur.'); }
  };

  const deverrouiller = async (id) => {
    try { await api.patch(`/utilisateurs/${id}/deverrouiller`); load(); }
    catch {}
  };

  const openPerms = (role) => {
    setModalRole(role);
    setPermsEdit([...role.permissions]);
  };

  const togglePerm = (k) => {
    setPermsEdit(p => p.includes(k) ? p.filter(x=>x!==k) : [...p,k]);
  };

  const savePerms = async () => {
    setSaving(true);
    try {
      await api.put(`/utilisateurs/roles/${modalRole.id_role}/permissions`, { permissions: permsEdit });
      setModalRole(null); load();
    } catch (e) { alert(e.response?.data?.message||'Erreur.'); }
    finally { setSaving(false); }
  };

  const changePwd = async () => {
    if (!newPwd || newPwd.length < 6) return alert('Minimum 6 caractères.');
    try {
      await api.patch(`/utilisateurs/${modalPwd.id_utilisateur}/mot-de-passe`,{nouveau_mot_de_passe:newPwd});
      setModalPwd(null); setNewPwd('');
      alert('Mot de passe modifié.');
    } catch (e) { alert(e.response?.data?.message||'Erreur.'); }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Utilisateurs & Rôles</h1>
          <p className="page-sub">{users.length} utilisateur{users.length>1?'s':''}</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-s" onClick={()=>setModalRole(roles.find(r=>r.nom_role==='AGENT')||roles[0])}>
            🔑 Gérer les rôles
          </button>
          <button className="btn-p" onClick={openNew}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      {/* Cartes rôles */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        {roles.map(r=>(
          <div key={r.id_role} style={{background:'#fff',borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',cursor:'pointer',border:'1.5px solid #F1F5F9',transition:'border-color .15s'}}
            onClick={()=>openPerms(r)}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span className={`badge ${ROLE_COLORS[r.nom_role]||'bg-info'}`}>{r.nom_role}</span>
              <span style={{fontSize:'.75rem',color:'#94A3B8'}}>{users.filter(u=>u.nom_role===r.nom_role).length} user(s)</span>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {r.permissions.map(p=>(
                <span key={p} style={{fontSize:'.7rem',background:'#F1F5F9',color:'#475569',padding:'2px 7px',borderRadius:10}}>{p.replace('_',' ')}</span>
              ))}
            </div>
            <div style={{marginTop:10,fontSize:'.78rem',color:'#2563EB',fontWeight:700}}>Modifier permissions →</div>
          </div>
        ))}
      </div>

      {/* Table utilisateurs */}
      <div className="tbl-card">
        {busy ? <div className="tbl-load"><div className="spin"/></div>
        : <table className="tbl">
            <thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th><th>Actions</th></tr></thead>
            <tbody>
              {!users.length
                ? <tr><td colSpan={6} className="empty-cell">Aucun utilisateur</td></tr>
                : users.map(u=>(
                    <tr key={u.id_utilisateur}>
                      <td>
                        <div className="cli-cell">
                          <div className="cli-av">{u.prenom?.[0]}{u.nom?.[0]}</div>
                          <div>
                            <div className="cli-name">{u.prenom} {u.nom}</div>
                            {u.compte_verrouille ? <span style={{fontSize:'.72rem',color:'#DC2626',fontWeight:700}}>🔒 Compte verrouillé</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">{u.email}</td>
                      <td><span className={`badge ${ROLE_COLORS[u.nom_role]||'bg-info'}`}>{u.nom_role}</span></td>
                      <td><span className={`badge ${u.statut?'bg-ok':'bg-danger'}`}>{u.statut?'Actif':'Inactif'}</span></td>
                      <td className="td-muted">
                        {u.date_derniere_connexion ? new Date(u.date_derniere_connexion).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn-ic" onClick={()=>openEdit(u)} title="Modifier">✏️</button>
                          <button className="btn-ic" onClick={()=>{ setModalPwd(u); setNewPwd(''); }} title="Changer mdp">🔑</button>
                          {u.compte_verrouille && <button className="btn-ic btn-ic--g" onClick={()=>deverrouiller(u.id_utilisateur)} title="Déverrouiller">🔓</button>}
                          <button className="btn-ic btn-ic--r" onClick={()=>supprimer(u.id_utilisateur)} title="Supprimer">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
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

      {/* Modal créer/modifier utilisateur */}
      {modal && (
        <div className="overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>{sel?'Modifier l\'utilisateur':'Nouvel utilisateur'}</h2>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            {err && <div className="f-error">{err}</div>}
            <div className="fgrid">
              <div className="fg"><label>Prénom *</label><input value={form.prenom} onChange={e=>f('prenom',e.target.value)}/></div>
              <div className="fg"><label>Nom *</label><input value={form.nom} onChange={e=>f('nom',e.target.value)}/></div>
              <div className="fg fg--full"><label>Email *</label><input type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></div>
              <div className="fg"><label>{sel?'Nouveau mot de passe':'Mot de passe *'}</label>
                <input type="password" value={form.mot_de_passe} onChange={e=>f('mot_de_passe',e.target.value)} placeholder={sel?'Laisser vide pour conserver':'Min 6 caractères'}/>
              </div>
              <div className="fg"><label>Rôle *</label>
                <select value={form.id_role} onChange={e=>f('id_role',e.target.value)}>
                  <option value="">— Choisir un rôle —</option>
                  {roles.map(r=><option key={r.id_role} value={r.id_role}>{r.nom_role}</option>)}
                </select>
              </div>
              {sel && <div className="fg"><label>Statut</label>
                <select value={form.statut} onChange={e=>f('statut',+e.target.value)}>
                  <option value={1}>Actif</option><option value={0}>Inactif</option>
                </select>
              </div>}
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={close}>Annuler</button>
              <button className="btn-p" onClick={save} disabled={saving}>{saving?'…':sel?'Enregistrer':'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal permissions rôle */}
      {modalRole && (
        <div className="overlay" onClick={()=>setModalRole(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>Permissions — <span className={`badge ${ROLE_COLORS[modalRole.nom_role]||'bg-info'}`}>{modalRole.nom_role}</span></h2>
              <button className="modal-close" onClick={()=>setModalRole(null)}>✕</button>
            </div>
            <div style={{padding:'12px 26px 20px',display:'flex',flexDirection:'column',gap:10}}>
              {ALL_PERMS.map(p=>(
                <label key={p.key} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',padding:'8px 10px',borderRadius:8,border:'1.5px solid',borderColor:permsEdit.includes(p.key)?'#2563EB':'#E2E8F0',background:permsEdit.includes(p.key)?'#EFF6FF':'#F8FAFC',transition:'all .15s'}}>
                  <input type="checkbox" checked={permsEdit.includes(p.key)} onChange={()=>togglePerm(p.key)} style={{accentColor:'#2563EB',width:16,height:16}}/>
                  <span style={{fontWeight:600,fontSize:'.9rem',color:permsEdit.includes(p.key)?'#1D4ED8':'#374151'}}>{p.label}</span>
                </label>
              ))}
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={()=>setModalRole(null)}>Annuler</button>
              <button className="btn-p" onClick={savePerms} disabled={saving}>{saving?'…':'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changement mot de passe */}
      {modalPwd && (
        <div className="overlay" onClick={()=>setModalPwd(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
            <div className="modal-hdr">
              <h2>Changer le mot de passe</h2>
              <button className="modal-close" onClick={()=>setModalPwd(null)}>✕</button>
            </div>
            <div style={{padding:'0 26px 10px'}}>
              <p style={{marginBottom:12,color:'#64748B',fontSize:'.88rem'}}>Utilisateur : <b>{modalPwd.prenom} {modalPwd.nom}</b></p>
              <div className="fg">
                <label>Nouveau mot de passe *</label>
                <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Min 6 caractères"/>
              </div>
            </div>
            <div className="modal-ftr">
              <button className="btn-s" onClick={()=>setModalPwd(null)}>Annuler</button>
              <button className="btn-p" onClick={changePwd}>Modifier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
