// Direct sessionStorage helpers for JWT token management
const TOKEN_KEY = 'app_session_token';
const USER_KEY = 'app_session_userId';
const PROFILE_KEY = 'app_session_profile';

// Session change listeners
const listeners = [];

const notifyListeners = () => {
  listeners.forEach(callback => callback());
};

export const getToken = () => {
  try {
    const t = window.sessionStorage?.getItem(TOKEN_KEY);
    return (t && String(t).trim().length > 10) ? t : null;
  } catch (e) {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token && String(token).trim().length > 10) {
      window.sessionStorage?.setItem(TOKEN_KEY, String(token));
    } else {
      window.sessionStorage?.removeItem(TOKEN_KEY);
    }
    notifyListeners();
  } catch (e) {}
};

export const removeToken = () => {
  try {
    window.sessionStorage?.removeItem(TOKEN_KEY);
    notifyListeners();
  } catch (e) {}
};

export const getUserId = () => {
  try {
    const u = window.sessionStorage?.getItem(USER_KEY);
    return (u && String(u).trim().length > 5) ? u : null;
  } catch (e) {
    return null;
  }
};

export const setUserId = (id) => {
  try {
    if (id && String(id).trim().length > 5) {
      window.sessionStorage?.setItem(USER_KEY, String(id));
    } else {
      window.sessionStorage?.removeItem(USER_KEY);
    }
    notifyListeners();
  } catch (e) {}
};

export const getProfile = () => {
  try {
    const p = window.sessionStorage?.getItem(PROFILE_KEY);
    return p ? JSON.parse(p) : null;
  } catch (e) {
    return null;
  }
};

export const setProfile = (profile) => {
  try {
    if (profile) {
      window.sessionStorage?.setItem(PROFILE_KEY, JSON.stringify(profile));
    } else {
      window.sessionStorage?.removeItem(PROFILE_KEY);
    }
    notifyListeners();
  } catch (e) {}
};

export const clearSession = () => {
  try {
    window.sessionStorage?.removeItem(TOKEN_KEY);
    window.sessionStorage?.removeItem(USER_KEY);
    window.sessionStorage?.removeItem(PROFILE_KEY);
    notifyListeners();
  } catch (e) {}
};

export const subscribe = (callback) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};
