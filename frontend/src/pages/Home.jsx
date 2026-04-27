/* ============================================================
   src/pages/Home.jsx — VERSION FINALE COMPLÈTE
   ✅ Remplacez entièrement votre ancien Home.jsx par ce code
   ============================================================ */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ✅ Votre image de billets — dossier "image" dans src/
import heroImage from '../image/vola.png';

import './Home.css';

/* ── Fonctionnalités ── */
const FEATURES = [
  {
    icon: '👤',
    titre: 'Gestion des Clients',
    desc: 'Enregistrez, suivez et gérez vos clients avec leurs groupes, profils et historiques complets.',
    color: '#3B82F6', bg: '#EFF6FF',
  },
  {
    icon: '💳',
    titre: 'Comptes & Transactions',
    desc: 'Gérez les comptes épargne et courant. Dépôts, retraits et virements sécurisés en temps réel.',
    color: '#10B981', bg: '#ECFDF5',
  },
  {
    icon: '📁',
    titre: 'Gestion des Prêts',
    desc: 'Soumission, approbation, échéancier automatique et suivi des remboursements en un seul endroit.',
    color: '#F59E0B', bg: '#FFFBEB',
  },
  {
    icon: '📊',
    titre: 'Tableau de Bord',
    desc: 'Visualisez vos KPIs en temps réel : épargne totale, prêts actifs, remboursements du jour.',
    color: '#8B5CF6', bg: '#F5F3FF',
  },
  {
    icon: '🔐',
    titre: 'Sécurité & Rôles',
    desc: "Contrôle d'accès par rôle (Admin, Superviseur, Agent, Caissier) avec journal d'audit complet.",
    color: '#EF4444', bg: '#FEF2F2',
  },
  {
    icon: '🔔',
    titre: 'Rapports & Notifications',
    desc: 'Alertes automatiques pour les retards, notifications en temps réel et historique des opérations.',
    color: '#06B6D4', bg: '#ECFEFF',
  },
];

/* ── Stats rapides ── */
const STATS = [
  { val: '100%',       label: 'Sécurisé',        icon: '🔐' },
  { val: 'Temps réel', label: 'Données live',     icon: '⚡' },
  { val: '4 rôles',    label: 'Utilisateurs',     icon: '👥' },
  { val: 'MySQL',      label: 'Base de données',  icon: '🗄️' },
];

export default function Home() {
  const navigate  = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  /* Parallax nav */
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Animation reveal au scroll */
  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Tous les boutons Se connecter → /login */
  const allerConnexion = () => navigate('/login');

  return (
    <div className="home">

      {/* ══════════════════════════════════
          NAVBAR
      ══════════════════════════════════ */}
      <nav className={'home-nav' + (scrollY > 40 ? ' home-nav--scrolled' : '')}>
        <div className="home-nav-inner">

          {/* Logo */}
          <div className="home-nav-logo" onClick={() => navigate('/')}>
            <div className="nav-logo-icon">🌿</div>
            <div>
              <div className="home-nav-name">MicroFinance</div>
              <div className="home-nav-sub">Gestion de Microfinance</div>
            </div>
          </div>

          {/* Liens + bouton */}
          <div className="home-nav-links">
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#contact">Contact</a>
            <button className="home-nav-btn" onClick={allerConnexion}>
              Se connecter →
            </button>
          </div>

        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO — Section principale
      ══════════════════════════════════ */}
      <section className="home-hero">

        {/* Fond dégradé + blobs animés */}
        <div className="hero-bg">
          <div className="hero-blob hero-blob--1"/>
          <div className="hero-blob hero-blob--2"/>
          <div className="hero-blob hero-blob--3"/>
        </div>

        <div className="hero-inner">

          {/* ── Texte gauche ── */}
          <div className="hero-content">

            <div className="hero-tag reveal">
              <span className="hero-tag-dot"/>
              Système de gestion moderne
            </div>

            <h1 className="hero-title reveal">
              Votre croissance<br/>
              <span className="hero-title-accent">commence</span><br/>
              ici
            </h1>

            <p className="hero-desc reveal">
              Accédez à un aperçu clair et détaillé de vos portefeuilles
              de prêt en temps réel.
            </p>

            <div className="hero-actions reveal">
              {/* Bouton 1 — plein bleu */}
              <button className="hero-btn-primary" onClick={allerConnexion}>
                → Voir l'analyse détaillée
              </button>
              {/* Bouton 2 — transparent */}
              <button className="hero-btn-secondary" onClick={allerConnexion}>
                Aller au tableau de bord principal ↓
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats reveal">
              {STATS.map((s, i) => (
                <div key={i} className="hero-stat">
                  <span className="hero-stat-icon">{s.icon}</span>
                  <div>
                    <div className="hero-stat-val">{s.val}</div>
                    <div className="hero-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ── Image droite — VOS BILLETS ── */}
          <div className="hero-image-wrap reveal">
            <img
              src={heroImage}
              alt="Billets microfinance malgache"
              className="hero-image"
            />
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════
          FONCTIONNALITÉS
      ══════════════════════════════════ */}
      <section className="home-features" id="fonctionnalites">
        <div className="features-inner">

          <div className="section-tag reveal">Fonctionnalités</div>
          <h2 className="section-title reveal">Tout ce dont vous avez besoin</h2>
          <p className="section-desc reveal">
            Une solution complète conçue pour les institutions de microfinance malgaches.
          </p>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card reveal"
                style={{ '--delay': `${i * 80}ms` }}
              >
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.titre}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════
          CTA
      ══════════════════════════════════ */}
      <section className="home-cta" id="contact">
        <div className="cta-inner reveal">
          <div className="cta-bg">
            <div className="cta-blob cta-blob--1"/>
            <div className="cta-blob cta-blob--2"/>
          </div>
          <div className="cta-content">
            <h2 className="cta-title">Prêt à commencer ?</h2>
            <p className="cta-desc">
              Connectez-vous et commencez à gérer votre microfinance dès maintenant.
              Données sécurisées, interface intuitive, résultats immédiats.
            </p>
            <button className="cta-btn" onClick={allerConnexion}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Se connecter maintenant
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
      ══════════════════════════════════ */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-logo">🌿 MicroFinance — Gestion de Microfinance</div>
          <div className="footer-copy">© 2026 — Projet académique</div>
        </div>
      </footer>

    </div>
  );
}
