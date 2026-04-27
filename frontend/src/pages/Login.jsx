import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [lang,     setLang]     = useState('FR');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const i18n = {
    FR:{ title:'Bienvenue!', sub:'Connectez-vous à votre compte', emailPh:'john.doe@email.com', pwdPh:'Mot de passe', forgot:'Mot de passe oublié ?', btn:'Se connecter', loading:'Connexion...', noAccount:"Vous n'avez pas de compte ?", register:'Inscrivez-vous' },
    EN:{ title:'Welcome!',   sub:'Sign in to your account',       emailPh:'john.doe@email.com', pwdPh:'Password',       forgot:'Forgot password?',          btn:'Sign In',       loading:'Signing in...', noAccount:"Don't have an account?",  register:'Sign up' },
  }[lang];

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  return (
    <div className="lp">
      {/* ── Côté gauche illustration ── */}
      <div className="lp-left">
        <div className="lp-blob lp-blob--1" />
        <div className="lp-blob lp-blob--2" />
        <div className="lp-illus">
          {/* Globle */}
          <div className="lp-globe" />
          {/* Flèche croissance */}
          <svg className="lp-arrow" viewBox="0 0 220 120">
            <defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60A5FA"/><stop offset="100%" stopColor="#2563EB"/>
            </linearGradient></defs>
            <polyline points="10,100 55,75 95,82 140,50 185,25" fill="none" stroke="url(#ag)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="178,17 194,28 182,35" fill="#2563EB"/>
          </svg>
          {/* Pièces */}
          <div className="lp-coins">
            {[...Array(6)].map((_,i) => <div key={i} className={`lp-coin lp-coin--${i}`} />)}
          </div>
          {/* Boutique */}
          <div className="lp-store">
            <div className="lp-store-roof" />
            <div className="lp-store-body">
              <div className="lp-store-door" />
            </div>
          </div>
          {/* Sac $ */}
          <div className="lp-bag"><span>$</span></div>
          {/* Calculatrice */}
          <div className="lp-calc">
            <div className="lp-calc-screen" />
            {[...Array(9)].map((_,i) => <div key={i} className="lp-calc-btn" />)}
          </div>
        </div>
      </div>

      {/* ── Côté droit formulaire ── */}
      <div className="lp-right">
        <div className="lp-card">
          {/* Logo */}
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <svg viewBox="0 0 44 44" width="44" height="44">
                <circle cx="22" cy="22" r="22" fill="#EFF6FF"/>
                <path d="M22 10C16 10 12 15 14 21C16 26 22 30 22 34C22 30 28 26 30 21C32 15 28 10 22 10Z" fill="#F59E0B"/>
                <circle cx="19" cy="15" r="3" fill="#FCD34D"/>
                <circle cx="25" cy="13" r="2.5" fill="#F59E0B"/>
                <circle cx="22" cy="18" r="2.5" fill="#FDE68A"/>
                <path d="M11 33 Q22 27 33 33" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
                <path d="M9 38 L16 31 L22 35 L28 31 L35 38" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="lp-logo-text">
              <span className="lp-logo-name">MicroFinance</span>
              <span className="lp-logo-sub">Gestion de Microfinance</span>
            </div>
          </div>

          <h1 className="lp-title">{i18n.title}</h1>
          <p  className="lp-sub">{i18n.sub}</p>

          {error && (
            <div className="lp-error">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="lp-form">
            {/* Email */}
            <div className="lp-field">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder={i18n.emailPh} required autoComplete="email"
              />
            </div>

            {/* Mot de passe */}
            <div className="lp-field">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94A3B8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                type={showPwd ? 'text' : 'password'} value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder={i18n.pwdPh} required autoComplete="current-password"
              />
              <button type="button" className="lp-eye" onClick={()=>setShowPwd(!showPwd)} tabIndex={-1}>
                {showPwd
                  ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            <div className="lp-forgot"><a href="#forgot">{i18n.forgot}</a></div>

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? i18n.loading : i18n.btn}
            </button>
          </form>

          <p className="lp-register">{i18n.noAccount} <a href="#register">{i18n.register}</a></p>

          <div className="lp-lang">
            <button className={lang==='FR'?'active':''} onClick={()=>setLang('FR')}>FR</button>
            <span>|</span>
            <button className={lang==='EN'?'active':''} onClick={()=>setLang('EN')}>EN</button>
          </div>
        </div>
      </div>
    </div>
  );
}
