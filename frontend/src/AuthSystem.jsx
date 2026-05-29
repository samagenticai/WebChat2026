import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import session from './session'
import { resolveApiBase } from './apiBase'

const API_BASE = resolveApiBase();

/* ─────────────── Phone Field with +92 prefix ─────────────── */
function PhoneField({ value, onChange }) {
  return (
    <div className="aw-phone-wrap">
      <div className="aw-phone-prefix">
        <span className="aw-flag">🇵🇰</span>
        <span className="aw-code">+92</span>
      </div>
      <input
        id="auth-phone"
        type="tel"
        value={value}
        onChange={onChange}
        placeholder="3001234567"
        required
        className="aw-phone-input"
        inputMode="numeric"
        maxLength={10}
      />
    </div>
  );
}

/* ─────────────── Generic Input ─────────────── */
function AuthInput({ id, label, type = 'text', value, onChange, placeholder, required, icon, extra }) {
  return (
    <div className="aw-group">
      <label htmlFor={id} className="aw-label">
        <span className="aw-label-icon">{icon}</span>
        {label}
      </label>
      <div className="aw-input-wrap">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="aw-input"
        />
        {extra}
      </div>
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */
const AuthSystem = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [form, setForm] = useState({ username: '', phone: '', password: '' });
  const [serverMsg, setServerMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (k) => (e) => {
    setServerMsg('');
    if (k === 'phone') {
      // strip leading 0 and non-digits
      const raw = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
      setForm(s => ({ ...s, phone: raw }));
    } else {
      setForm(s => ({ ...s, [k]: e.target.value }));
    }
  };

  const fullPhone = () => {
    const p = form.phone.replace(/\D/g, '').replace(/^0+/, '');
    // build +923XXXXXXXXX
    return `+92${p}`;
  };

  const parseRes = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { return await res.json(); } catch { return { error: 'Invalid JSON' }; }
    }
    const t = await res.text();
    return { error: t || `HTTP ${res.status}` };
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setServerMsg('');
    if (!form.phone || form.phone.length < 9) {
      setServerMsg('Phone number kam az kam 9 digits hona chahiye');
      return;
    }
    setLoading(true);
    try {
      const phone = fullPhone();
      if (isLogin) {
        if (!form.password) { setServerMsg('Password zaroori hai'); setLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: phone, password: form.password }),
        });
        const data = await parseRes(res);
        if (!res.ok) throw new Error(data.error || 'Login failed');
        if (!data.token) throw new Error('Token nahi mila');
        session.setToken(data.token);
        const uid = data.user?._id || data.user?.id;
        if (!uid) throw new Error('User ID missing');
        session.setUserId(uid);
        session.setProfile(data.user || null);
        navigate('/chat');
      } else {
        if (!form.username || !form.password) { setServerMsg('Tamam fields bhari jayein'); setLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, phone, password: form.password }),
        });
        const data = await parseRes(res);
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        if (!data.token) throw new Error('Token nahi mila');
        session.setToken(data.token);
        const uid = data.user?._id || data.user?.id;
        if (!uid) { session.removeToken(); throw new Error('User ID missing'); }
        session.setUserId(uid);
        session.setProfile(data.user || null);
        navigate('/chat');
      }
    } catch (err) {
      setServerMsg(err.message || 'Request failed');
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(v => !v);
    setServerMsg('');
    setForm({ username: '', phone: '', password: '' });
  };

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('prefill');
    if (q && !q.includes('@')) {
      const stripped = q.replace(/^\+92/, '').replace(/^0/, '').replace(/\D/g, '');
      setForm(s => ({ ...s, phone: stripped }));
    }
  }, []);

  /* ── Eye SVG ── */
  const EyeOpen = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOff = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* ── Page shell: exactly like chat bg ── */
        .aw-page {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f2f5;
          font-family: 'Inter', system-ui, sans-serif;
          padding: 1rem;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Card: mirrors chat sidebar white card ── */
        .aw-card {
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
          overflow: hidden;
          animation: aw-in .35s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes aw-in {
          from { opacity:0; transform: translateY(18px); }
          to   { opacity:1; transform: translateY(0); }
        }

        /* ── Top coloured bar (indigo-600 = chat accent) ── */
        .aw-topbar {
          background: #4f46e5;
          padding: 1.6rem 1.8rem 1.3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .5rem;
        }
        .aw-logo-circle {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: rgba(255,255,255,0.18);
          border: 2px solid rgba(255,255,255,0.28);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          margin-bottom: .25rem;
        }
        .aw-app-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -.3px;
        }
        .aw-sub {
          font-size: .8rem;
          color: rgba(255,255,255,.72);
          font-weight: 400;
        }

        /* ── Tabs ── */
        .aw-tabs {
          display: flex;
          margin: 0;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .aw-tab {
          flex: 1;
          padding: .8rem;
          border: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: .875rem;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          position: relative;
          transition: color .2s;
        }
        .aw-tab::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #4f46e5;
          border-radius: 2px 2px 0 0;
          transform: scaleX(0);
          transition: transform .25s ease;
        }
        .aw-tab.act { color: #4f46e5; }
        .aw-tab.act::after { transform: scaleX(1); }
        .aw-tab:hover:not(.act) { color: #64748b; }

        /* ── Form body ── */
        .aw-body {
          padding: 1.5rem 1.8rem 1.8rem;
        }

        /* ── Field group ── */
        .aw-group {
          margin-bottom: 1.1rem;
        }
        .aw-label {
          display: flex;
          align-items: center;
          gap: .35rem;
          font-size: .78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #64748b;
          margin-bottom: .45rem;
        }
        .aw-label-icon { font-size: .9rem; }
        .aw-input-wrap { position: relative; }
        .aw-input {
          width: 100%;
          padding: .7rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #1e293b;
          font-size: .95rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .aw-input::placeholder { color: #cbd5e1; }
        .aw-input:focus {
          border-color: #4f46e5;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(79,70,229,.12);
        }

        /* ── Phone row ── */
        .aw-phone-wrap {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color .2s, box-shadow .2s;
        }
        .aw-phone-wrap:focus-within {
          border-color: #4f46e5;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(79,70,229,.12);
        }
        .aw-phone-prefix {
          display: flex;
          align-items: center;
          gap: .3rem;
          padding: .7rem .75rem .7rem 1rem;
          border-right: 1px solid #e2e8f0;
          background: #f1f5f9;
          user-select: none;
          flex-shrink: 0;
        }
        .aw-flag { font-size: 1.05rem; line-height: 1; }
        .aw-code { font-size: .88rem; font-weight: 700; color: #374151; font-family: 'Inter', sans-serif; }
        .aw-phone-input {
          flex: 1;
          padding: .7rem .9rem;
          background: transparent;
          border: none;
          color: #1e293b;
          font-size: .95rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          min-width: 0;
        }
        .aw-phone-input::placeholder { color: #cbd5e1; }

        /* ── Password with toggle ── */
        .aw-pw-input {
          padding-right: 2.8rem !important;
        }
        .aw-eye {
          position: absolute;
          right: .8rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: .2rem;
          transition: color .15s;
        }
        .aw-eye:hover { color: #4f46e5; }

        /* ── Slide-in for extra field ── */
        .aw-slide {
          animation: aw-slide-in .25s cubic-bezier(.22,1,.36,1) both;
          overflow: hidden;
        }
        @keyframes aw-slide-in {
          from { opacity:0; transform: translateY(-8px); max-height:0; }
          to   { opacity:1; transform: translateY(0);   max-height:120px; }
        }

        /* ── Submit btn: indigo-600 like chat ── */
        .aw-btn {
          width: 100%;
          padding: .82rem;
          background: #4f46e5;
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: .95rem;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          margin-top: .4rem;
          transition: background .18s, transform .15s, box-shadow .18s;
          box-shadow: 0 4px 12px rgba(79,70,229,.3);
          letter-spacing: .2px;
        }
        .aw-btn:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(79,70,229,.35);
        }
        .aw-btn:active:not(:disabled) { transform: scale(.98); }
        .aw-btn:disabled { opacity: .65; cursor: not-allowed; }

        /* ── Spinner ── */
        .aw-spin {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: sp .7s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes sp { to { transform: rotate(360deg); } }

        /* ── Error box ── */
        .aw-err {
          display: flex;
          align-items: flex-start;
          gap: .5rem;
          margin-top: .9rem;
          padding: .65rem .9rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: .82rem;
          line-height: 1.4;
          animation: aw-in .2s ease both;
        }
        .aw-err svg { flex-shrink: 0; margin-top: 1px; }

        /* ── Divider ── */
        .aw-divider {
          display: flex;
          align-items: center;
          gap: .6rem;
          margin: 1.1rem 0 .5rem;
          color: #cbd5e1;
          font-size: .75rem;
        }
        .aw-divider::before,.aw-divider::after {
          content:''; flex:1; height:1px; background:#e2e8f0;
        }

        /* ── Footer link ── */
        .aw-foot {
          text-align: center;
          font-size: .82rem;
          color: #94a3b8;
          margin-top: .75rem;
        }
        .aw-foot button {
          background: none; border: none;
          color: #4f46e5; font-weight: 600;
          font-family: 'Inter', sans-serif;
          font-size: .82rem;
          cursor: pointer; padding: 0;
          transition: color .15s;
        }
        .aw-foot button:hover { color: #4338ca; text-decoration: underline; }

        /* ── Hint text ── */
        .aw-hint {
          font-size: .75rem;
          color: #94a3b8;
          margin-top: .3rem;
          padding-left: .2rem;
        }

        @media (max-width: 440px) {
          .aw-body { padding: 1.2rem 1.2rem 1.5rem; }
          .aw-topbar { padding: 1.3rem 1.2rem 1rem; }
        }
      `}</style>

      <div className="aw-page">
        <div className="aw-card">

          {/* ── Top bar ── */}
          <div className="aw-topbar">
            <div className="aw-logo-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="aw-app-name">ChatApp</div>
            <div className="aw-sub">
              {isLogin ? 'Apne account mein login karein' : 'Naya account banayein'}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="aw-tabs">
            <button className={`aw-tab ${isLogin ? 'act' : ''}`} onClick={() => { if (!isLogin) toggleMode(); }}>
              Login
            </button>
            <button className={`aw-tab ${!isLogin ? 'act' : ''}`} onClick={() => { if (isLogin) toggleMode(); }}>
              Register
            </button>
          </div>

          {/* ── Form ── */}
          <div className="aw-body">
            <form onSubmit={submitForm} autoComplete="off">

              {/* Name – only register */}
              {!isLogin && (
                <div className="aw-slide aw-group">
                  <label htmlFor="auth-name" className="aw-label">
                    <span className="aw-label-icon">👤</span> Pura Naam
                  </label>
                  <div className="aw-input-wrap">
                    <input
                      id="auth-name"
                      type="text"
                      value={form.username}
                      onChange={handleChange('username')}
                      placeholder="Ali Khan"
                      required
                      className="aw-input"
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="aw-group">
                <label htmlFor="auth-phone" className="aw-label">
                  <span className="aw-label-icon">📱</span> Phone Number
                </label>
                <PhoneField value={form.phone} onChange={handleChange('phone')} />
                <div className="aw-hint">0 ke baghair likhein — mithaal: 3001234567</div>
              </div>

              {/* Password */}
              <div className="aw-group">
                <label htmlFor="auth-pass" className="aw-label">
                  <span className="aw-label-icon">🔒</span> Password
                </label>
                <div className="aw-input-wrap">
                  <input
                    id="auth-pass"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="••••••••"
                    required
                    className="aw-input aw-pw-input"
                  />
                  <button type="button" className="aw-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass
                      ? <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="aw-btn" disabled={loading}>
                {loading && <span className="aw-spin" />}
                {loading
                  ? (isLogin ? 'Login ho raha hai...' : 'Account ban raha hai...')
                  : (isLogin ? 'Login Karein' : 'Register Karein')
                }
              </button>

              {/* Error */}
              {serverMsg && (
                <div className="aw-err">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {serverMsg}
                </div>
              )}
            </form>

            <div className="aw-divider">ya phir</div>

            <div className="aw-foot">
              {isLogin ? 'Account nahi hai? ' : 'Pehle se account hai? '}
              <button onClick={toggleMode}>
                {isLogin ? 'Register karein →' : 'Login karein →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthSystem;