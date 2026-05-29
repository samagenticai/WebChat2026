import React, { useState, useRef } from 'react';

export default function GroupForm({
  showCreateGroup,
  setShowCreateGroup,
  groupNameInput,
  setGroupNameInput,
  groupMemberIds,
  setGroupMemberIds,
  contacts,
  createGroup,
  apiBase,
  token,
  getSavedContactName
}) {
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  if (!showCreateGroup) return null;

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(f.type)) {
      setError('Unsupported image format');
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    setError('');
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return '';
    if (!apiBase || !token) return '';
    setUploading(true);
    try {
      const fm = new FormData();
      fm.append('avatar', avatarFile);
      const res = await fetch(`${apiBase}/api/messages/group-avatar-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fm
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      setSuccess('Avatar uploaded');
      return d.avatar || '';
    } catch (err) {
      setError(err.message || 'Upload error');
      return '';
    } finally {
      setUploading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 2500);
    }
  };

  const onCreate = async () => {
    setError('');
    if (!groupNameInput.trim()) return setError('Group name required');
    if (!groupMemberIds || groupMemberIds.length === 0) return setError('Select at least one member');

    // Upload avatar first if present
    let avatarPath = '';
    if (avatarFile) {
      avatarPath = await uploadAvatar();
      if (!avatarPath) return; // upload failed, error set
    }

    await createGroup(avatarPath);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-auto" onClick={() => setShowCreateGroup(false)}>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[96vh] sm:mt-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"/><path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"/></svg>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800">New Group</div>
              <div className="text-xs text-slate-500">Create a group and add members</div>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setShowCreateGroup(false)}>✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Group Name</label>
            <input
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Team, Family, Friends..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Group Photo</label>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400">No photo</div>
                )}
              </div>
              <div className="flex gap-2">
                <label className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer hover:bg-slate-50">
                  Upload
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </label>
                <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" onClick={() => { setAvatarFile(null); setAvatarPreview(''); if (fileRef.current) fileRef.current.value = ''; }}>Remove</button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Members</label>
            <div className="mt-2 max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              {contacts.filter(c => !c.isGroup).map(c => {
                const id = String(c._id);
                const checked = groupMemberIds.includes(id);
                const label = getSavedContactName ? getSavedContactName(c) : (c.displayName || c.phone || c.username);
                return (
                  <label key={c._id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-600 overflow-hidden">
                        {c.avatar ? <img src={c.avatar} alt={label} className="w-full h-full object-cover" /> : (label || '?')[0].toUpperCase()}
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{label}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setGroupMemberIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id))}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setShowCreateGroup(false)}>Cancel</button>
            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60" onClick={onCreate} disabled={uploading}>{uploading ? 'Creating...' : 'Create Group'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
                                                