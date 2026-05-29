import React from 'react';
import AvatarImg from '../user/AvatarImg';

export default function SidebarHeader({
  myProfile,
  showMenu,
  setShowMenu,
  menuRef,
  navigate,
  setShowAdd,
  logout
}) {
  const toggleTheme = () => {
    try {
      const root = document.documentElement;
      const nextDark = !root.classList.contains('dark');
      root.classList.toggle('dark', nextDark);
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    } catch (e) { }
  };

  return (
    <div className="p-4 bg-white flex justify-between items-center border-b border-slate-100 sticky top-0 z-30 font-sans">

      {/* App Logo & Name Section */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          ChatNest
        </h1>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-1" ref={menuRef}>

        {/* Status Icon */}
        <button
          onClick={() => navigate('/status')}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all relative"
          title="Status"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 0 20M2 12a10 10 0 0 1 20 0" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Create Group */}
        <button
          onClick={() => { window.dispatchEvent(new CustomEvent('open-create-group')); }}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all"
          title="Create Group"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M20 8v6"></path>
            <path d="M23 11h-6"></path>
          </svg>
        </button>

        {/* Menu Container */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-full transition-all duration-200 ${showMenu ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </button>

          {/* Right Aligned Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[100] py-2 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right">

              {/* 1. Profile Option */}
              <button
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                onClick={() => { navigate('/profile'); setShowMenu(false); }}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-100">
                  <AvatarImg
                    src={myProfile?.avatar || ''}
                    username={myProfile?.username || 'M'}
                    size="w-8 h-8"
                  />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">My Profile</p>
                  <p className="text-[10px] text-slate-400 font-medium">Settings & Identity</p>
                </div>
              </button>

              <div className="my-1 border-t border-slate-50/80"></div>

              {/* 2. Add Contact Option */}
              <button
                onClick={() => { setShowAdd(true); setShowMenu(false); }}
                className="w-full px-4 py-3 text-left text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors text-sm font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                </div>
                Add New Contact
              </button>

              <div className="my-1 border-t border-slate-50/80"></div>

              {/* 3. Dark/Light Mode */}
              <button
                onClick={() => { toggleTheme(); setShowMenu(false); }}
                className="w-full px-4 py-3 text-left text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors text-sm font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
                Dark / Light Mode
              </button>

              <div className="my-1 border-t border-slate-50/80"></div>

              {/* 4. Logout Option */}
              <button
                onClick={() => { logout(); setShowMenu(false); }}
                className="w-full px-4 py-3 text-left text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors text-sm font-bold"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                </div>
                Log Out
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}