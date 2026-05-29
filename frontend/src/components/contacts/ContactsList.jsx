import React from 'react';
import AvatarImg from '../user/AvatarImg';

export default function ContactsList({
  contacts,
  contactSearch,
  activeContact,
  selectContact,
  isContactOnline,
  formatContactStatus,
  getLastMessageForContact,
  formatLastMessage,
  formatLastMessageTime,
  formatDuration,
  unreadCounts,
  typingUsers,
  userId,
  myProfile,
  statusFeed,
  token,
  setContacts,
  getSavedContactName
}) {
  const handleDeleteContact = async (e, contactId) => {
    e.stopPropagation();
    console.log('[delete] Full contact object from click:', e.target.closest('[data-contact-id]')?.dataset.contactId);
    
    if (!token || !API_BASE) {
      console.log('[delete] Missing token or API_BASE');
      return;
    }
    
    if (!window.confirm('Delete this contact?')) return;
    
    try {
      console.log('[delete] ContactId to delete:', contactId);
      console.log('[delete] ContactId type:', typeof contactId);
      console.log('[delete] API endpoint:', `${API_BASE}/api/users/contacts/${contactId}`);
      console.log('[delete] Token exists:', !!token);
      
      const res = await fetch(`${API_BASE}/api/users/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[delete] Response status:', res.status, res.statusText);
      const responseData = await res.json();
      console.log('[delete] Response data:', responseData);
      
      if (res.ok) {
        // Remove contact from list
        setContacts(prev => {
          const updated = prev.filter(c => String(c._id) !== String(contactId));
          console.log('[delete] Contacts before:', prev.length, 'after:', updated.length);
          return updated;
        });
      } else {
        console.error('[delete] Failed response:', responseData);
        alert('Failed to delete contact: ' + (responseData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('[delete] Fetch error:', err);
      alert('Error deleting contact: ' + err.message);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const meId = myProfile?._id || userId;
    if (String(c._id) === String(meId)) return false;
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (c.displayName || '').toLowerCase().includes(q) ||
           (c.username || '').toLowerCase().includes(q) ||
           (c.phone || '').toLowerCase().includes(q) ||
           (c.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] px-2 py-2">
      {filteredContacts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <div className="p-4 bg-slate-100 rounded-full mb-3">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <p className="text-xs font-semibold tracking-wide uppercase opacity-60">No Conversations</p>
        </div>
      )}

      {filteredContacts.map(c => {
        const isActive = activeContact?._id === c._id;
        const isTyping = typingUsers.has(String(c._id));
        const lastMsg = getLastMessageForContact(c._id);
        const unreadCount = unreadCounts[String(c._id)] || 0;
        const online = isContactOnline(c._id);
        const hasStatus = statusFeed && statusFeed.some(s => String(s.userId?._id || s.userId) === String(c._id));

        // Debug logging
        console.log('[ContactsList] Rendering contact:', { _id: c._id, displayName: c.displayName, username: c.username });

        return (
          <div 
            key={c._id}
            data-contact-id={c._id}
            data-contact-name={c.displayName || c.username}
            onClick={() => selectContact(c)}
            className={`
              group flex items-center gap-3 px-3 py-3 mb-1 rounded-2xl cursor-pointer transition-all duration-200 relative
              ${isActive 
                ? 'bg-white shadow-sm ring-1 ring-slate-200/50' 
                : 'hover:bg-slate-200/40'}
            `}
          >
            {/* Active Indicator Dot */}
            {isActive && (
              <div className="absolute left-1 w-1 h-6 bg-slate-800 rounded-full" />
            )}

            {/* Avatar Section with Circle Design */}
            <div className="relative flex-shrink-0">
              <div className={`
                w-12 h-12 rounded-full overflow-hidden transition-transform duration-300 flex items-center justify-center bg-indigo-100
                ${isActive ? 'scale-105' : 'group-hover:scale-105'}
              `}>
                <AvatarImg 
                  src={c.avatar} 
                  username={getSavedContactName ? getSavedContactName(c) : (c.displayName || c.username)} 
                  size="w-full h-full text-lg" 
                  className="flex items-center justify-center"
                />
              </div>
              {online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm ring-1 ring-green-500/30 active-indicator z-10" title="Active now"></div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              {/* Header: Name + Time */}
              <div className="flex justify-between items-center w-full mb-1">
                <h4 className={`text-[14.5px] font-bold truncate flex-1 min-w-0 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                  {getSavedContactName ? getSavedContactName(c) : (c.displayName || c.username)}
                </h4>
                <span className={`text-[9px] font-semibold whitespace-nowrap ml-2 flex-shrink-0 tracking-tight ${unreadCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formatLastMessageTime(lastMsg)}
                </span>
              </div>

              {/* Last Message Preview Only */}
              <div className="mt-0.5">
                {isTyping ? (
                  <div className="flex items-center gap-1">
                    <span className="flex gap-0.5">
                      <span className="w-0.5 h-0.5 bg-emerald-500 rounded-full animate-bounce"></span>
                      <span className="w-0.5 h-0.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-0.5 h-0.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                    <p className="text-[11px] font-bold text-emerald-500 italic">typing...</p>
                  </div>
                ) : (
                  <div className="text-[11px] truncate flex items-center gap-1 text-slate-600">
                    {lastMsg?.image?.path ? (
                      <span className="text-slate-500 font-medium">📷 Photo</span>
                    ) : lastMsg?.video?.path ? (
                      <span className="text-slate-500 font-medium">🎬 Video</span>
                    ) : lastMsg?.audio?.path ? (
                      <span className="text-slate-500 font-medium">🎤 Voice</span>
                    ) : (
                      <span className="truncate">{formatLastMessage(lastMsg)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Unread Badge + Delete Button */}
            <div className="flex items-center gap-1">
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <div className="flex-shrink-0 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-emerald-600 text-white text-[8px] font-black">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  handleDeleteContact(e, c._id);
                }}
                className="flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                title="Delete contact"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}