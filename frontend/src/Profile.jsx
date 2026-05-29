import React, { useState, useEffect } from 'react'
import { resolveApiBase } from './apiBase'

const API_BASE = resolveApiBase();

export default function Profile({ token, userId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load');
        const d = await res.json();
        if (!mounted) return;
        const u = d.user || {};
        setAbout(u.about || '');
        const av = u.avatar || '';
        setAvatarPreview(av && av.startsWith('/') ? `${API_BASE}${av}` : av);
        setPhone(u.phone || '');
        setUsername(u.username || '');
      } catch (err) {
        console.error('Profile load error', err);
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; }
  }, [token]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  const save = async () => {
    if (!token) return setStatus('Not authenticated');
    setStatus('Saving...');
    try {
      const fm = new FormData();
      fm.append('about', about || '');
      if (avatarFile) fm.append('avatar', avatarFile);
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fm
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error('Save error:', err);
        setStatus(err.error || 'Save failed');
        return;
      }
      const d = await res.json();
      console.log('Profile saved:', d);
      if (d.user) {
        const av2 = d.user.avatar || '';
        setAvatarPreview(av2 && av2.startsWith('/') ? `${API_BASE}${av2}` : av2 || avatarPreview);
        setAbout(d.user.about || '');
        setAvatarFile(null);
      }
      setStatus('Successfully saved!');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setStatus('Save failed: ' + err.message);
    }
  }

  if (loading) return <div className="p-4 text-slate-500 text-sm">Loading...</div>

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">{username}</h2>
      {avatarPreview && (
        <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200" />
      )}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase text-slate-400">Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-2 p-2 sm:p-3 rounded-lg border border-slate-200 bg-white text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-slate-400">Phone</label>
          <input type="text" value={phone} readOnly className="w-full mt-2 p-2 sm:p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-slate-400">About</label>
          <textarea value={about} onChange={e => setAbout(e.target.value)} className="w-full mt-2 p-2 sm:p-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-indigo-300" rows={4} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Avatar</label>
          <input type="file" accept="image/*" onChange={onFile} className="mt-2 text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>
        {status && <div className={`text-xs sm:text-sm font-medium ${status.includes('saved') ? 'text-green-600' : 'text-slate-600'}`}>{status}</div>}
        <div className="flex gap-2 sm:gap-3 mt-4">
          <button onClick={save} className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm sm:text-base font-bold rounded-lg hover:bg-indigo-700 transition">Save</button>
          <button onClick={onClose} className="flex-1 px-3 sm:px-4 py-2 border border-slate-300 text-sm sm:text-base rounded-lg hover:bg-slate-50 transition">Done</button>
        </div>
      </div>
    </div>
  )
}
