// src/pages/Rapports.jsx
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';
import './shared.css';

const fmt = v => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(v)+' Ar';

const TABS = [
  { id:'resume',    label:'📋 Résumé général' },
  { id:'prets',     label:'📁 Prêts' },
  { id:'epargnes',  label:'🐷 Épargnes' },
  { id:'retards',   label:'⚠️ Retards' },
  { id:'jour',      label:'📅 Remboursements du jour' },
];

export default function Rapports() {
  const [tab,      setTab]      = useState('resume');
  const [resume,   setResume]   = useState(null);
  const [prets,    setPrets]    = useState([]);
  const [epargnes, setEpargnes] = useState([]);
  const [retards,  setRetards]  = useState([]);
  const [jour,     setJour]     = useState({ data:[], total_du_jour:0 });
  const [busy,     setBusy]     = useState(false);

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    setBusy(true);
    try {
      if (tab === 'resume') {
        const r = await api.get('/rapports/resume');
        setResume(r.data);
      } else if (tab === 'prets') {
        const [p, r] = await Promise.all([
          api.get('/rapports/prets-par-mois'),
          api.get('/rapports/remboursements-par-mois'),
        ]);
        setPrets(p.data.map(m => ({
          ...m,
          remboursements: r.data.find(x=>x.mois===m.mois)?.montant_total || 0,
        })));
      } else if (tab === 'epargnes') {
        const r = await api.get('/rapports/epargnes-par-mois');
        setEpargnes(r.data);
      } else if (tab === 'retards') {
        const r = await api.get('/rapports/retards');
        setRetards(r.data);
      } else if (tab === 'jour') {
        const r = await api.get('/rapports/remboursements-du-jour');
        setJour(r.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Rapports</h1>
          <p className="page-sub">Analyses et statistiques financières</p>
        </div>
        <button className="btn-s" onClick={loadTab}>
          🔄 Actualiser
        </button>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',borderBottom:'2px solid #E2E8F0',marginBottom:20,gap:0,overflowX:'auto'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              background:'none',border:'none',cursor:'pointer',
              padding:'10px 20px',fontSize:'.88rem',fontWeight:700,
              color: tab===t.id ? '#2563EB' : '#64748B',
              borderBottom: tab===t.id ? '2px solid #2563EB' : '2px solid transparent',
              marginBottom:-2, whiteSpace:'nowrap',
              transition:'color .15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {busy && <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spin"/></div>}

      {/* ── RÉSUMÉ ── */}
      {!busy && tab==='resume' && resume && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {[
              { titre:'Clients', items:[
                { label:'Total', val: resume.clients.total },
                { label:'Actifs', val: resume.clients.actifs },
              ], color:'#3B82F6', icon:'👤' },
              { titre:'Prêts', items:[
                { label:'Total', val: resume.prets.total },
                { label:'En cours', val: resume.prets.en_cours },
                { label:'En retard', val: resume.prets.en_retard },
                { label:'Capital total', val: fmt(resume.prets.montant_total) },
              ], color:'#F59E0B', icon:'📁' },
              { titre:'Épargne & Remboursements', items:[
                { label:'Épargne totale', val: fmt(resume.epargne.total) },
                { label:'Total remboursé', val: fmt(resume.rembours.total_rembourse) },
                { label:'Nb remboursements', val: resume.rembours.nb_remboursements },
              ], color:'#10B981', icon:'💰' },
            ].map((card,i) => (
              <div key={i} style={{background:'#fff',borderRadius:14,padding:'20px 22px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',borderTop:`3px solid ${card.color}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <span style={{fontSize:'1.2rem'}}>{card.icon}</span>
                  <span style={{fontWeight:800,color:'#1E293B',fontSize:'1rem'}}>{card.titre}</span>
                </div>
                {card.items.map((item,j) => (
                  <div key={j} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid #F1F5F9'}}>
                    <span style={{fontSize:'.85rem',color:'#64748B'}}>{item.label}</span>
                    <span style={{fontSize:'.95rem',fontWeight:700,color:'#1E293B'}}>{item.val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRÊTS ── */}
      {!busy && tab==='prets' && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{background:'#fff',borderRadius:14,padding:22,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <h3 style={{fontWeight:800,color:'#1E293B',marginBottom:16}}>Évolution des prêts sur 12 mois</h3>
            {!prets.length
              ? <p style={{color:'#94A3B8',textAlign:'center',padding:'40px 0'}}>Aucune donnée disponible</p>
              : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                    <XAxis dataKey="mois_label" tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={v=>`${v/1000}k`} tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{borderRadius:10,fontSize:12}}/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                    <Bar dataKey="montant_total"   name="Capital accordé"   fill="#3B82F6" radius={[4,4,0,0]}/>
                    <Bar dataKey="remboursements"  name="Remboursements"    fill="#10B981" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          <div style={{background:'#fff',borderRadius:14,padding:22,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <h3 style={{fontWeight:800,color:'#1E293B',marginBottom:16}}>Nombre de prêts par mois</h3>
            {!prets.length
              ? <p style={{color:'#94A3B8',textAlign:'center',padding:'40px 0'}}>Aucune donnée</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={prets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                    <XAxis dataKey="mois_label" tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{borderRadius:10,fontSize:12}}/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                    <Line dataKey="nb_prets"   name="Prêts accordés" stroke="#3B82F6" strokeWidth={2} dot={{r:4}}/>
                    <Line dataKey="en_retard"  name="En retard"      stroke="#EF4444" strokeWidth={2} dot={{r:4}}/>
                    <Line dataKey="rembourses" name="Remboursés"     stroke="#10B981" strokeWidth={2} dot={{r:4}}/>
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>
      )}

      {/* ── ÉPARGNES ── */}
      {!busy && tab==='epargnes' && (
        <div style={{background:'#fff',borderRadius:14,padding:22,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <h3 style={{fontWeight:800,color:'#1E293B',marginBottom:16}}>Dépôts et retraits épargne sur 12 mois</h3>
          {!epargnes.length
            ? <p style={{color:'#94A3B8',textAlign:'center',padding:'40px 0'}}>Aucune donnée disponible</p>
            : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={epargnes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                  <XAxis dataKey="mois_label" tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>`${v/1000}k`} tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{borderRadius:10,fontSize:12}}/>
                  <Legend wrapperStyle={{fontSize:12}}/>
                  <Bar dataKey="depots"  name="Dépôts"   fill="#10B981" radius={[4,4,0,0]}/>
                  <Bar dataKey="retraits" name="Retraits" fill="#EF4444" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      )}

      {/* ── RETARDS ── */}
      {!busy && tab==='retards' && (
        <div className="tbl-card">
          {!retards.length
            ? (
              <div style={{padding:'60px 20px',textAlign:'center'}}>
                <div style={{fontSize:'3rem',marginBottom:12}}>✅</div>
                <p style={{fontWeight:700,color:'#059669',fontSize:'1.1rem'}}>Aucun prêt en retard !</p>
                <p style={{color:'#94A3B8',fontSize:'.88rem',marginTop:6}}>Tous les remboursements sont à jour.</p>
              </div>
            )
            : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Capital</th>
                    <th>Échéances en retard</th>
                    <th>Montant dû</th>
                    <th>Depuis le</th>
                  </tr>
                </thead>
                <tbody>
                  {retards.map((r,i) => (
                    <tr key={i}>
                      <td><strong>{r.client_nom}</strong></td>
                      <td className="td-muted">{r.telephone||'—'}</td>
                      <td>{fmt(r.montant_capital)}</td>
                      <td>
                        <span className="badge bg-danger">{r.nb_echeances_retard} échéance{r.nb_echeances_retard>1?'s':''}</span>
                      </td>
                      <td><strong style={{color:'#DC2626'}}>{fmt(r.montant_retard)}</strong></td>
                      <td className="td-muted">
                        {new Date(r.premiere_echeance_retard).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* ── REMBOURSEMENTS DU JOUR ── */}
      {!busy && tab==='jour' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Total du jour */}
          <div style={{
            background:'linear-gradient(135deg,#059669,#10B981)',
            borderRadius:14, padding:'20px 24px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            color:'#fff',
          }}>
            <div>
              <div style={{fontSize:'.85rem',opacity:.85,marginBottom:4}}>Total remboursé aujourd'hui</div>
              <div style={{fontSize:'2rem',fontWeight:800}}>{fmt(jour.total_du_jour)}</div>
              <div style={{fontSize:'.78rem',opacity:.7,marginTop:4}}>
                {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
              </div>
            </div>
            <div style={{fontSize:'3rem'}}>📅</div>
          </div>

          {/* Tableau */}
          <div className="tbl-card">
            {!jour.data.length
              ? (
                <div style={{padding:'60px 20px',textAlign:'center'}}>
                  <div style={{fontSize:'3rem',marginBottom:12}}>📭</div>
                  <p style={{fontWeight:700,color:'#64748B',fontSize:'1rem'}}>Aucun remboursement enregistré aujourd'hui</p>
                </div>
              )
              : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Téléphone</th>
                      <th>Tranche</th>
                      <th>Date échéance</th>
                      <th>Montant dû</th>
                      <th>Montant payé</th>
                      <th>Heure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jour.data.map((r,i) => (
                      <tr key={i}>
                        <td><strong>{r.client_nom}</strong></td>
                        <td className="td-muted">{r.telephone||'—'}</td>
                        <td>
                          <span className="badge bg-info">Tranche {r.numero_tranche}</span>
                        </td>
                        <td className="td-muted">
                          {new Date(r.date_echeance).toLocaleDateString('fr-FR')}
                        </td>
                        <td>{fmt(r.montant_total_echeance)}</td>
                        <td><strong style={{color:'#059669'}}>{fmt(r.montant)}</strong></td>
                        <td className="td-muted">
                          {new Date(r.date_paiement).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}
