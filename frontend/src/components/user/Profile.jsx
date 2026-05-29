import React, { useState, useEffect } from 'react';
import { resolveApiBase } from '../../apiBase';

const API_BASE = resolveApiBase();

export default function Profile({ token, userId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState({ media: 0, images: 0, videos: 0, audio: 0, links: 0, docs: 0 });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!res.ok) throw new Error('Failed to load');
        const d = await res.json();
        if (!mounted) return;
        const u = d.user || {};
        setAbout(u.about || '');
        const av = u.avatar || '';
        setAvatarPreview(av && av.startsWith('/') ? `${API_BASE}${av}` : av);
        setPhone(u.phone || '');
        setDisplayName(u.displayName || '');
      } catch (err) {
        console.error('Profile load error', err);
      } finally { if (mounted) setLoading(false); }
    }
    load();
    // fetch conversation summary (media/links/docs) if viewing another user
    const fetchSummary = async () => {
      if (!token || !userId) return;
      try {
        const res = await fetch(`${API_BASE}/api/messages/summary/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const d = await res.json();
        if (!mounted) return;
        setSummary(d.counts || summary);
      } catch (err) { /* ignore */ }
    }
    fetchSummary();
    const onMessageSent = () => { fetchSummary(); };
    window.addEventListener('message-sent', onMessageSent);
    return () => { mounted = false; }
  }, [token]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarFailed(false);
    setAvatarPreview(URL.createObjectURL(f));
  }

  const save = async () => {
    if (!token) return setStatus('Not authenticated');
    setStatus('Saving...');
    try {
      const fm = new FormData();
      fm.append('displayName', displayName || '');
      fm.append('about', about || '');
      if (avatarFile) fm.append('avatar', avatarFile);
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fm
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setStatus(err.error || 'Save failed');
        return;
      }
      const d = await res.json();
      if (d.user) {
        const av2 = d.user.avatar || '';
        setAvatarFailed(false);
        setAvatarPreview(av2 && av2.startsWith('/') ? `${API_BASE}${av2}` : av2 || avatarPreview);
        setAbout(d.user.about || '');
        setDisplayName(d.user.displayName || '');
        setAvatarFile(null);
      }
      setStatus('Success! Profile updated');
      setTimeout(() => setStatus(''), 2500);
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white font-bold">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    /* Fixed Inset-0 ensure it takes full viewport and isn't centered by a parent */
    <div className="fixed inset-0 z-[100] bg-white flex overflow-hidden font-sans text-slate-700 selection:bg-indigo-100">
      
      {/* Sidebar Section (Stays on the left) */}
      <div className="w-full md:w-[380px] lg:w-[420px] border-r border-slate-100 flex flex-col bg-white shrink-0 shadow-sm z-10 animate-in slide-in-from-left duration-300">
        
        {/* Compact Header */}
        <div className="bg-white border-b border-slate-50 p-5 pt-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Profile Settings</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {/* Profile Picture */}
          <div className="flex justify-center py-10">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-slate-50 shadow-md bg-slate-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
                {!avatarFailed && avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" onError={() => setAvatarFailed(true)} />
                ) : (
                  <div className="text-5xl font-bold text-slate-400">{(displayName || 'U')[0].toUpperCase()}</div>
                )}
              </div>
              
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300 cursor-pointer backdrop-blur-[1px]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" accept="image/*" onChange={onFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* Settings List */}
          <div className="px-8 space-y-7">
            
            {/* Field: Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider px-1">Display Name</label>
              <div className="group flex items-center border-b border-slate-200 focus-within:border-indigo-400 transition-all py-1">
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 text-sm font-medium py-1" 
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Field: About */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider px-1">Status / About</label>
              <div className="group flex items-center border-b border-slate-200 focus-within:border-indigo-400 transition-all py-1">
                <input 
                  type="text" 
                  value={about} 
                  onChange={e => setAbout(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-600 text-sm py-1" 
                  placeholder="Tell people something about you..."
                />
              </div>
            </div>

            {/* Field: Phone (Info only) */}
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Registered Phone</label>
              <div className="text-slate-500 text-xs font-blod flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {phone}
              </div>
            </div>

            {/* Action Section */}
            <div className="pt-4 flex flex-col gap-3 pb-10">
              {/* Conversation Summary */}
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="text-center">
                  <div className="text-xs text-slate-400">Media</div>
                  <div className="font-bold text-lg">{summary.media || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Links</div>
                  <div className="font-bold text-lg">{summary.links || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Docs</div>
                  <div className="font-bold text-lg">{summary.docs || 0}</div>
                </div>
              </div>
              <button 
                onClick={save} 
                className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {status === 'Saving...' ? (
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Update Profile'}
              </button>
              
              {status && status !== 'Saving...' && (
                <div className="text-center text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty Space / Decorative Area (Fills the rest of the screen) */}
      <div className="hidden md:flex flex-1 bg-slate-50/50 items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="text-center p-10 z-10">
           <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           </div>
           <h3 className="text-xl font-bold text-slate-400 tracking-tight">Your Identity</h3>
           <p className="text-slate-400 mt-2 text-xs max-w-[260px] leading-relaxed mx-auto">
             Keep your profile up to date so your friends can easily find you.
           </p>
        </div>
        
        <div className="absolute bottom-10 flex items-center gap-2 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
           Secure Account
        </div>
      </div>

    </div>
  )
}