const DEFAULT_BACKEND_PORT = 5000;

export function resolveApiBase() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  if (envUrl) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalHostOverride = envUrl.startsWith('http://localhost') || envUrl.startsWith('http://127.0.0.1');
      const isPageLocal = hostname === 'localhost' || hostname === '127.0.0.1';

      // If the page is loaded from a LAN/mobile host and the env override is localhost,
      // ignore the override and use the current hostname with backend port.
      if (isLocalHostOverride && !isPageLocal) {
        return `${window.location.protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
      }
    }

    return envUrl;
  }

  if (typeof window === 'undefined') {
    return `http://localhost:${DEFAULT_BACKEND_PORT}`;
  }

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${DEFAULT_BACKEND_PORT}`;
  }

  // LAN access: use same hostname but with backend port
  return `${window.location.protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
}

export function apiUrl(path) {
  const base = resolveApiBase().replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
