import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as tokenSession from '../../utils/sessionStorage';
import { Phone, Lock, User, ArrowRight, MessageSquare, ShieldCheck, Sparkles, Zap, Globe, Users } from 'lucide-react';
import { resolveApiBase } from '../../apiBase';

const API_BASE = resolveApiBase();

const AuthSystem = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [form, setForm] = useState({ username: '', phone: '', password: '', countryCode: '+92' });
  const [serverMsg, setServerMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submitForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerMsg('');
    const fullPhone = `${form.countryCode}${form.phone}`;
    const payload = isLogin 
      ? { identifier: fullPhone, password: form.password }
      : { username: form.username, phone: fullPhone, password: form.password };

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      if (data.token) {
        tokenSession.setToken(data.token);
        if (data.user) {
          tokenSession.setUserId(data.user._id);
          tokenSession.setProfile(data.user);
        }
        navigate('/chat');
      }
    } catch (err) {
      setServerMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-white flex font-sans antialiased">
      
      {/* LEFT SIDE: Branding & Features (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden flex-col justify-between p-16">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500 rounded-full blur-[100px] opacity-40"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center">
            <MessageSquare className="text-white w-7 h-7" />
          </div>
          <span className="text-3xl font-black text-white italic tracking-tighter">ChatNest</span>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Connecting <br /> 
            <span className="text-indigo-200">People Globally.</span>
          </h2>
          <div className="space-y-8">
            <FeatureItem icon={<Zap />} title="Real-time Sync" desc="Instant message delivery with zero latency." />
            <FeatureItem icon={<Globe />} title="Global Reach" desc="Stay connected with friends across the world." />
            <FeatureItem icon={<Users />} title="Group Nests" desc="Create safe spaces for your communities." />
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="relative z-10 flex items-center gap-2 text-indigo-100/70 text-sm font-medium">
          <ShieldCheck className="w-5 h-5" />
          <span>End-to-End Encryption Standard</span>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center p-6 bg-slate-50 relative">
        
        {/* Background Decorations for Mobile */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="w-full max-w-[400px] z-10">
          {/* Header (Mobile Only Branding) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mb-4">
              <MessageSquare className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 italic">ChatNest</h1>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 sm:p-10">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">
                {isLogin ? 'Welcome Back' : 'Join the Nest'}
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                {isLogin ? 'Please enter your account details.' : 'Start your journey with ChatNest today.'}
              </p>
            </div>

            <form onSubmit={submitForm} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                    <input 
                      type="text" required 
                      value={form.username} onChange={handleChange('username')}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-slate-700 font-medium" 
                      placeholder="e.g. Ali Khan" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="flex gap-2">
                  <select 
                    value={form.countryCode} 
                    onChange={handleChange('countryCode')}
                    className="w-[85px] px-2 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none font-bold text-slate-700 text-sm"
                  >
                    <option value="+92">+92</option>
                    <option value="+966">+966</option>
                    <option value="+1">+1</option>
                  </select>
                  <div className="relative flex-1 group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                    <input 
                      type="tel" required 
                      value={form.phone} onChange={handleChange('phone')}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-slate-700 font-medium" 
                      placeholder="300 1234567" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                  <input 
                    type="password" required 
                    value={form.password} onChange={handleChange('password')}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-slate-700 font-medium" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-slate-200"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? 'Sign In' : 'Get Started')}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already in the Nest? Login"}
              </button>
            </div>
          </div>
          
          {serverMsg && (
            <div className="mt-4 flex items-center gap-2 text-rose-500 text-xs font-bold justify-center bg-rose-50 p-3 rounded-xl border border-rose-100">
              <ShieldCheck className="w-4 h-4" />
              {serverMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for features
const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-indigo-100 flex-shrink-0">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <h4 className="text-white font-bold text-lg">{title}</h4>
      <p className="text-indigo-100/70 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default AuthSystem;