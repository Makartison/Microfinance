import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import './Dashboard.css';

const fmt = v => new Intl.NumberFormat('fr-MG',{maximumFractionDigits:0}).format(v)+' Ar';

/* ── Carte statistique ── */
const KPI = ({ icon, label, value, sub, color }) => (
  <div className={`kpi kpi--${color}`}>
    <div className="kpi-icon">{icon}</div>
    <div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  </div>
);

/* ── Badge statut prêt ── */
const Badge = ({ statut, decision }) => {
  if (decision === 'REFUSE')     return <span className="badge badge-danger">Refusé</span>;
  if (decision === 'EN_ATTENTE') return <span className="badge badge-warn">En Attente</span>;
  if (decision === 'ACCEPTE' && statut === 'EN_COURS') return <span className="badge badge-ok">Approuvé</span>;
  if (statut === 'EN_RETARD')    return <span className="badge badge-danger">En Retard</span>;
  if (statut === 'REMBOURSE')    return <span className="badge badge-info">Remboursé</span>;
  return <span className="badge badge-warn">En Cours</span>;
};

/* ── Calendrier mensuel ── */
const Calendar = ({ echeances }) => {
  const now  = new Date();
  const y    = now.getFullYear(), m = now.getMonth();
  const nom  = new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'}).format(now)
               .split(' ').map((w,i)=>i===0?w[0].toUpperCase()+w.slice(1):w).join(' ');
  const first = (new Date(y,m,1).getDay()||7);
  const days  = new Date(y,m+1,0).getDate();
  const evts  = new Set(echeances.map(e=>new Date(e.date_echeance).getDate()));
  const cells = [...Array(first-1).fill(null), ...Array.from({length:days},(_,i)=>i+1)];

  return (
    <div className="cal">
      <div className="cal-head">
        <span className="cal-title">Calendrier des Rappels</span>
        <span className="cal-month">{nom}</span>
      </div>
      <div className="cal-grid cal-grid--hdr">
        {['L','M','M','J','V','S','D'].map((d,i)=><div key={i} className="cal-dh">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d,i)=>(
          <div key={i} className={`cal-d${!d?' cal-d--x':''}${d===now.getDate()?' cal-d--today':''}${d&&evts.has(d)?' cal-d--evt':''}`}>
            {d}
          </div>
        ))}
      </div>
      {echeances.length>0 && <div className="cal-legend"><span className="cal-dot"/>Rappel de Paiement</div>}
    </div>
  );
};

export default function Dashboard() {
  const [stats,  setStats]  = useState(null);
  const [graph,  setGraph]  = useState([]);
  const [prets,  setPrets]  = useState([]);
  const [acts,   setActs]   = useState([]);
  const [echs,   setEchs]   = useState([]);
  const [busy,   setBusy]   = useState(true);

  useEffect(()=>{
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/statistiques-mensuelles'),
      api.get('/dashboard/derniers-prets'),
      api.get('/dashboard/activites-recentes'),
      api.get('/dashboard/echeances-du-mois'),
    ]).then(([s,g,p,a,e])=>{
      setStats(s.data);
      const mois=[...new Set([...g.data.prets.map(x=>x.mois),...g.data.epargnes.map(x=>x.mois)])];
      setGraph(mois.map(m=>({
        mois:m,
        Prêts:   g.data.prets.find(x=>x.mois===m)?.total||0,
        Épargnes:g.data.epargnes.find(x=>x.mois===m)?.total||0,
      })));
      setPrets(p.data); setActs(a.data); setEchs(e.data);
    }).catch(console.error).finally(()=>setBusy(false));
  },[]);

  if (busy) return (
    <div className="db-loading">
      <div className="spin"/><p>Chargement du tableau de bord…</p>
    </div>
  );

  return (
    <div className="db">
      {/* ── KPIs ── */}
      <div className="kpi-grid">
        <KPI color="blue"
          icon={<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          label="Total Clients"
          value={Number(stats?.total_clients).toLocaleString('fr-FR')}
          sub={`+${stats?.nouveaux_clients_mois} ce mois`}
        />
        <KPI color="green"
          icon={<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
          label="Total Prêts"
          value={`${stats?.total_prets}  —  ${fmt(stats?.montant_prets||0)}`}
          sub={`+${fmt(stats?.montant_prets_mois||0)} ce mois`}
        />
        <KPI color="orange"
          icon={<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 0 1 7.39 16.74"/><path d="M12 22a10 10 0 0 1-7.39-16.74"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          label="Épargne Totale"
          value={fmt(stats?.epargne_totale||0)}
          sub={`+${fmt(stats?.epargne_mois||0)} ce mois`}
        />
        <KPI color="purple"
          icon={<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          label="Remboursements du Jour"
          value={fmt(stats?.remboursements_jour||0)}
        />
      </div>

      {/* ── Ligne 2 : Graphique + Derniers prêts ── */}
      <div className="db-row">
        <div className="db-card db-card--wide">
          <h2 className="db-card-title">Statistiques Financières</h2>
          <ResponsiveContainer width="100%" height={255}>
            <BarChart data={graph} margin={{top:8,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
              <XAxis dataKey="mois" tick={{fontSize:12,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`${v/1000}k`} tick={{fontSize:12,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{borderRadius:10,border:'1px solid #E2E8F0',fontSize:13}}/>
              <Legend wrapperStyle={{fontSize:13,paddingTop:12}} iconType="square"/>
              <Bar dataKey="Prêts"    fill="#4ADE80" radius={[4,4,0,0]}/>
              <Bar dataKey="Épargnes" fill="#3B82F6" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="db-card">
          <div className="db-card-hdr">
            <h2 className="db-card-title" style={{marginBottom:0}}>Derniers Prêts</h2>
            <div className="db-dots"><span/><span/><span/></div>
          </div>
          <table className="mini-tbl">
            <thead><tr><th>Client</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              {!prets.length
                ? <tr><td colSpan={3} className="empty-td">Aucun prêt</td></tr>
                : prets.map(p=>(
                    <tr key={p.id_pret}>
                      <td>{p.client}</td>
                      <td>{fmt(p.montant_capital)}</td>
                      <td><Badge statut={p.statut} decision={p.decision}/></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          <a href="/dashboard/prets" className="voir-plus">
            Voir Plus <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
      </div>

      {/* ── Ligne 3 : Activités + Calendrier ── */}
      <div className="db-row">
        <div className="db-card db-card--wide">
          <div className="db-card-hdr">
            <h2 className="db-card-title" style={{marginBottom:0}}>Activités Récentes</h2>
            <a href="/dashboard/transactions" className="voir-toutes">Voir Toutes</a>
          </div>
          <div className="acts">
            {!acts.length
              ? <p className="empty-msg">Aucune activité</p>
              : acts.slice(0,6).map(a=>(
                  <div key={a.id_transaction} className="act-row">
                    <div className={`act-dot act-dot--${a.coefficient===1?'g':'r'}`}>
                      {a.coefficient===1?'+':'−'}
                    </div>
                    <div className="act-txt">
                      <b>{a.nom_type}</b> de <b>{fmt(a.montant)}</b> par <a href="/dashboard/clients">{a.client_nom}</a>
                    </div>
                    <div className="act-date">
                      {new Date(a.date_transaction).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                    </div>
                  </div>
                ))
            }
          </div>
          {acts.length>6 && <a href="/dashboard/transactions" className="voir-plus" style={{marginTop:8}}>Voir Toutes</a>}
        </div>

        <div className="db-card">
          <Calendar echeances={echs}/>
        </div>
      </div>
    </div>
  );
}
