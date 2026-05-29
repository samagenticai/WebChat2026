import { useEffect } from 'react';

/**
 * Hook to manage user online status and profile fetching
 */
export function useChatStatus(token, userId, API_BASE, setMyProfile) {
  // Mark user as online and keep-alive
  useEffect(() => {
    if (!token || !userId) return;

    // Mark as online immediately
    const markOnline = async () => {
      try {
        await fetch(`${API_BASE}/api/users/online`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {}
    };

    markOnline();

    // Keep-alive: refresh online status every 10 seconds
    const keepAliveInterval = setInterval(markOnline, 10000);

    // Mark as offline on page unload
    const handleBeforeUnload = () => {
      fetch(`${API_BASE}/api/users/offline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(keepAliveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token, userId, API_BASE]);

  // Fetch current user's profile for menu label
  useEffect(() => {
    let mounted = true;
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const d = await res.json();
        if (!mounted) return;
        if (d.user) {
          const user = { ...d.user };
          if (user.avatar && user.avatar.startsWith('/'))
            user.avatar = `${API_BASE}${user.avatar}`;
          setMyProfile(user);
        }
      } catch (e) {}
    })();
    return () => {
      mounted = false;
    };
  }, [token, API_BASE, setMyProfile]);
}
