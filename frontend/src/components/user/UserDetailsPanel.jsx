import React from 'react'

export default function UserDetailsPanel({
  isOpen,
  onClose,
  user,
  onPhotoClick,
  onMediaClick,
  isLoading,
  onEdit,
  token,
  apiBase,
  contactSummaries
}) {

  // Get all messages for this user (passed as prop)
  const messages = user?.messages || [];
  // Filter for media (images/videos)
  const mediaMessages = messages.filter(m => (m.image && m.image.path) || (m.video && m.video.path));
  // Show up to 6 recent media
  const recentMedia = mediaMessages.slice(-6).reverse();
  // Helper to get full path
  const getFullPath = (p) => {
    if (!p) return '';
    if (p.startsWith('http')) return p;
    return `${apiBase || ''}${p}`;
  };
  const summary = (contactSummaries && contactSummaries[String(user?._id)]) || { media: 0, links: 0, docs: 0 };

  if (!isOpen || !user) return null;

  return (
    <div className="h-screen w-full flex flex-col bg-white font-sans overflow-hidden">
      {/* Header - Image jaisa: Close left pe, Title beech mein, Edit right pe */}
      <div className="sticky top-0 bg-white p-4 flex items-center justify-between z-10 border-b border-slate-200/50 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h3 className="text-lg font-medium text-slate-800">Contact info</h3>
        <button onClick={() => onEdit && onEdit(user)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center pt-2 pb-6">
          <div 
            onClick={(e) => { e.stopPropagation(); onPhotoClick && onPhotoClick(); }}
            className="w-40 h-40 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer mb-4"
          >
            {user.avatar ? (
              <img 
                src={getFullPath(user.avatar)} 
                alt={user.displayName}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="text-6xl font-bold text-indigo-200">
                {(user.displayName || user.username)?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {user.displayName || user.username}
          </h2>
          <p className="text-slate-500 mt-1">{user.phone || `@${user.username}`}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 px-6 mb-8">
          <button className="flex-1 flex flex-col items-center gap-2 py-3 px-2 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"/>
            </svg>
            <span className="text-sm font-medium text-slate-700">Search</span>
          </button>
          {!user?.isGroup && (
            <button onClick={() => onEdit && onEdit(user)} className="flex-1 flex flex-col items-center gap-2 py-3 px-2 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              <span className="text-sm font-medium text-slate-700">Save Contact</span>
            </button>
          )}
        </div>

        {/* Fields - Same as before but styled like the pic */}
        <div className="px-6 space-y-6">
          {/* About Section */}
          <div>
            <p className="text-sm text-slate-500 mb-2">About</p>
            <p className="text-[15px] text-slate-800 leading-relaxed">
              {user.about || "People say i act like i dont care, i am not acting bruh 😉"}
            </p>
          </div>

          {user?.isGroup && (
            <>
              <div className="h-px bg-slate-100 w-full"></div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Members</p>
                <div className="space-y-2">
                  {(user.groupMembers || []).map((m) => (
                    <div key={m.id} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 break-all">
                      {m.label || m.phone || m.id}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-slate-100 w-full"></div>

          {/* Media, Links and Docs Section */}
          <div className="space-y-3">
            {/* Media Count */}

            {summary.media > 0 && (
              <div>
                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <span className="text-[15px] font-medium text-slate-800">📸 Media</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{summary.media}</span>
                </div>
                {/* Media Gallery Preview */}
                {recentMedia.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {recentMedia.map((m, i) => {
                      const path = m.image?.path || m.video?.path || '';
                      const full = getFullPath(path);
                      return (
                        <button key={i} onClick={() => onMediaClick && onMediaClick(full)} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 p-0">
                          {m.image && m.image.path ? (
                            <img src={full} alt="media" className="w-full h-full object-cover" />
                          ) : m.video && m.video.path ? (
                            <video src={full} className="w-full h-full object-cover" controls={false} />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Links Count */}
            {summary.links > 0 && (
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </div>
                  <span className="text-[15px] font-medium text-slate-800">🔗 Links</span>
                </div>
                <span className="text-sm font-semibold text-purple-600">{summary.links}</span>
              </div>
            )}

            {/* Docs Count */}
            {summary.docs > 0 && (
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                  </div>
                  <span className="text-[15px] font-medium text-slate-800">📄 Documents</span>
                </div>
                <span className="text-sm font-semibold text-amber-600">{summary.docs}</span>
              </div>
            )}

            {summary.media === 0 && summary.links === 0 && summary.docs === 0 && recentMedia.length > 0 && (
              <div className="flex flex-col items-center mt-2">
                <div className="text-sm font-semibold text-slate-700 mb-1">Recent Media</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentMedia.map((m, i) => {
                    const path = m.image?.path || m.video?.path || '';
                    const full = getFullPath(path);
                    return (
                      <button key={i} onClick={() => onMediaClick && onMediaClick(full)} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 p-0 cursor-pointer hover:shadow-md transition-shadow">
                        {m.image && m.image.path ? (
                          <img src={full} alt="media" className="w-full h-full object-cover" />
                        ) : m.video && m.video.path ? (
                          <video src={full} className="w-full h-full object-cover" controls={false} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {summary.media === 0 && summary.links === 0 && summary.docs === 0 && recentMedia.length === 0 && (
              <div className="text-center py-4 text-slate-400">
                <p className="text-sm">No media, links or documents shared</p>
              </div>
            )}
          </div>

          {/* Email Section (Your additional field) */}
          {user.email && (
             <div className="pt-2">
                <p className="text-sm text-slate-500 mb-1">Email</p>
                <p className="text-[15px] text-slate-800">{user.email}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}