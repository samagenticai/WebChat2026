import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthSystem from './AuthSystem'
import ChatPage from './pages/ChatPage'
import ProfilePage from './ProfilePage'
import StatusPage from './pages/StatusPage'
import session from './session'
import { resolveApiBase } from './apiBase'

function RequireAuth({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current token immediately
    const t = session.getToken();
    setToken(t);
    setLoading(false);

    // Subscribe to future changes
    const unsub = session.subscribe(() => {
      setToken(session.getToken());
    });
    return unsub;
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current token immediately from sessionStorage
    const t = session.getToken();
    setToken(t);
    setLoading(false);

    // Subscribe to future changes
    const unsub = session.subscribe(() => {
      const newToken = session.getToken();
      setToken(newToken);
    });
    return unsub;
  }, []);

  // Apply persisted theme (light/dark)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const isDark = saved === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) { }
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  const API_BASE = resolveApiBase();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthSystem mode="login" />} />
        <Route path="/register" element={<AuthSystem mode="register" />} />
        <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/status" element={<RequireAuth><StatusPage API_BASE={API_BASE} /></RequireAuth>} />
        <Route path="/" element={token ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={token ? '/chat' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
