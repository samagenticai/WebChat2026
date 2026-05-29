import React, { useMemo, useState } from 'react';
import AvatarImg from '../user/AvatarImg';

export default function ChatHeader({
  activeContact,
  myProfile,
  isContactOnline,
  typingUsers,
  setShowSidebar,
  handleOpenUserDetails,
  getContactStatusWithDateTime,
  onChangeWallpaper,
  groupSubtitle,
  onSaveContact,
  isSavedContact,
  getSavedContactName
}) {
  const isTyping = typingUsers.has(String(activeContact?._id));
  const online = isContactOnline(activeContact?._id);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = useMemo(() => ([
    ...(activeContact?.isGroup ? [] : [{ key: 'wallpaper', label: 'Change Wallpaper', onClick: () => onChangeWallpaper?.() }]),
    { key: 'details', label: 'Contact Info', onClick: () => handleOpenUserDetails?.(activeContact) },
  ]), [onChangeWallpaper, handleOpenUserDetails, activeContact]);

  return (
    <header className="h-16 sm:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center px-4 justify-between z-40">

      {/* Left Section: Info & Avatar */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button for Mobile */}
        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-7 sm:h-7"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        {/* Profile Info Clickable */}
        <div
          onClick={() => handleOpenUserDetails(activeContact)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-indigo-200 transition-all flex items-center justify-center bg-indigo-50">
              <AvatarImg
                src={activeContact?.avatar}
                username={getSavedContactName ? getSavedContactName(activeContact) : (activeContact?.displayName || activeContact?.username)}
                size="w-full h-full text-lg"
                className="flex items-center justify-center"
              />
            </div>
            {online && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm ring-1 ring-emerald-500/30 z-10"></div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors">
              {getSavedContactName ? getSavedContactName(activeContact) : (activeContact.displayName || activeContact.phone || 'Unknown')}
            </h3>
            <div className="flex items-center gap-1.5">
              {activeContact?.isGroup ? (
                <span className="text-[10px] sm:text-[11px] font-medium truncate text-slate-400">
                  {groupSubtitle || 'Group chat'}
                </span>
              ) : isTyping ? (
                <span className="text-[11px] font-bold text-indigo-500 animate-pulse tracking-wide">
                  Typing...
                </span>
              ) : online ? (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 tracking-wide">
                    Active now
                  </span>
                </div>
              ) : (
                <span className="text-[10px] sm:text-[11px] font-medium truncate text-slate-400">
                  {getContactStatusWithDateTime ? getContactStatusWithDateTime(activeContact) : 'Offline'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Call Actions */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Save Contact Icon - Show if contact is not saved and not a group */}
        {!isSavedContact && !activeContact?.isGroup && (
          <button
            onClick={() => onSaveContact?.()}
            className="p-2.5 text-slate-400 hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-all"
            title="Save Contact"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-6 sm:h-6">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="12" y1="12" x2="12" y2="18" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
        )}

        {/* Three-dot menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all"
            title="More"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="sm:w-6 sm:h-6">
              <circle cx="12" cy="5" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="12" cy="19" r="2"></circle>
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-52">
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setMenuOpen(false); item.onClick?.(); }}
                    className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors text-sm"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}