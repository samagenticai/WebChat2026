import React, { useState } from 'react'

export default function EditUserPanel({ isOpen, onClose, apiBase, token, user, onSaved, currentUserId }) {
  if (!isOpen || !user) return null;

  const isSelf = String(user._id) === String(currentUserId);
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      // If editing own profile -> update /profile
      if (isSelf) {
        const fd = new FormData()
        // Backend supports about/avatar; keep phone immutable here.
        // We keep this UI focused on contact-friendly name for others.
        fd.append('about', user.about || '')
        const res = await fetch(`${apiBase}/api/users/profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || `Status ${res.status}`)
        }
        const d = await res.json()
        if (d.user) {
          const updated = { ...d.user }
          if (updated.avatar && updated.avatar.startsWith('/')) updated.avatar = `${apiBase}${updated.avatar}`
          onSaved && onSaved(updated)
        }
      } else {
        // Editing another user's details -> create/update an override for current user.
        const body = { displayName }
        const res = await fetch(`${apiBase}/api/users/contacts/override/${user._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || `Status ${res.status}`)
        }
        const d = await res.json()
        // merge override into returned selected user view - keep all user fields intact!
        const updated = { 
          ...user,
          _id: user._id,
          username: user.username || '',
          phone: user.phone || '',
          email: user.email || '',
          about: user.about || '',
          avatar: user.avatar || '',
        };
        if (d.override) {
          if (d.override.displayName) updated.displayName = d.override.displayName;
          if (d.override.phone) updated.phone = d.override.phone;
        }
        onSaved && onSaved(updated)
      }
    } catch (err) {
      setError(err.message || String(err))
    } finally { setLoading(false) }
  }

  return (
    <div className="h-full w-full flex flex-col bg-white font-sans">
      <div className="sticky top-0 bg-white p-4 flex items-center justify-between z-10">
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h3 className="text-lg font-medium text-slate-800">{isSelf ? 'Edit Profile' : 'Save Contact'}</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ali / Ahmad / etc" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          {!isSelf && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</div>
              <div className="text-sm font-semibold text-slate-700 mt-1">{phone || '—'}</div>
              <div className="text-[11px] text-slate-500 mt-1">This does not change the user’s real backend name.</div>
            </div>
          )}

          {error && <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">{error}</div>}

        </div>
      </div>
    </div>
  )
}
