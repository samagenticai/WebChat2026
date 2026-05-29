// Session with sessionStorage persistence (survives refresh, clears on browser close).
// Uses sessionStorage (NOT localStorage) to ensure proper cleanup
const STORAGE_TOKEN_KEY = 'app_session_token';
const STORAGE_USER_KEY = 'app_session_userId';
const STORAGE_PROFILE_KEY = 'app_session_profile';

const session = (() => {
  // Initialize from sessionStorage on load
  let token = null;
  let userId = null;
  let profile = null;
  
  try {
    if (typeof window !== 'undefined') {
      const t = window.sessionStorage.getItem(STORAGE_TOKEN_KEY);
      const u = window.sessionStorage.getItem(STORAGE_USER_KEY);
      const p = window.sessionStorage.getItem(STORAGE_PROFILE_KEY);
      
      token = t && String(t).trim() && String(t).length > 10 ? t : null;
      userId = u && String(u).trim() && String(u).length > 5 ? u : null;
      
      try {
        profile = p ? JSON.parse(p) : null;
      } catch (parseErr) {
        profile = null;
      }
    }
  } catch (e) { 
    console.warn('[session] Error loading from storage:', e);
  }

  const displayNames = new Map();
  const listeners = new Set();

  const notify = () => listeners.forEach(fn => { try { fn(); } catch(e){} });

  const persist = () => {
    try {
      if (typeof window === 'undefined') return;
      if (token) window.sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
      else window.sessionStorage.removeItem(STORAGE_TOKEN_KEY);
      if (userId) window.sessionStorage.setItem(STORAGE_USER_KEY, userId);
      else window.sessionStorage.removeItem(STORAGE_USER_KEY);
      if (profile) window.sessionStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
      else window.sessionStorage.removeItem(STORAGE_PROFILE_KEY);
    } catch (e) { 
      console.warn('[session] Error persisting to storage:', e);
    }
  };
                                               
  return {     
    // getters
    getToken() { return (token && String(token).trim() && String(token).length > 10) ? token : null; },
    getUserId() { return (userId && String(userId).trim() && String(userId).length > 5) ? userId : null; },
    getProfile() { return profile ? { ...profile } : null; },

    // setters
    setToken(t) { token = (t && String(t).trim() && String(t).length > 10) ? String(t) : null; persist(); notify(); },
    removeToken() { token = null; persist(); notify(); },
    setUserId(id) { userId = (id && String(id).trim() && String(id).length > 5) ? String(id) : null; persist(); notify(); },
    setProfile(p) { 
      profile = p ? { ...p } : null; 
      persist();
      notify();
    },

    // display name cache
    setDisplayName(key, name) { if (!key) return; displayNames.set(String(key), name); notify(); },
    getDisplayName(key) { if (!key) return null; return displayNames.get(String(key)) || null; },

    // clear entire session
    clear() { 
      token = null; 
      userId = null; 
      profile = null;
      displayNames.clear(); 
      persist();
      notify(); 
    },

    // subscribe to changes: returns unsubscribe
    subscribe(fn) { if (typeof fn !== 'function') return () => {}; listeners.add(fn); return () => listeners.delete(fn); }
  };
})();

export default session; 
