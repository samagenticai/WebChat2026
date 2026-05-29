import React, { useEffect, useState } from 'react';
import OtpInput from '../components/auth/OtpInput';
import { resolveApiBase } from '../apiBase';

const API_BASE = resolveApiBase();

const OtpPage = ({ identifier, mode = 'register', onVerified, onBack }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    setTimer(60);
    const t = setInterval(() => setTimer((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [identifier]);

  const verify = async () => {
    setError('');
    if (!otp || otp.length < 3) return setError('Enter the OTP');
    setLoading(true);
    try{
      const url = mode === 'register' ? `${API_BASE}/api/auth/verify-otp` : `${API_BASE}/api/auth/login-otp-verify`;
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp })
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch(e) { data = { error: text }; }
      if (!res.ok) throw new Error(data.error || data.message || text || 'Verify failed');
      onVerified && onVerified(data);
    }catch(err){ setError(err.message || 'Verify failed'); }
    setLoading(false);
  };

  const resend = async () => {
    setError('');
    setLoading(true);
    try{
      const url = mode === 'register' ? `${API_BASE}/api/auth/register-otp` : `${API_BASE}/api/auth/login-otp`;
      // For register we need more info; backend returns OTP in test mode only.
      const body = mode === 'register' ? { identifier } : { identifier };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch(e) { data = { error: text }; }
      if (!res.ok) throw new Error(data.error || data.message || text || 'Resend failed');
      setTimer(60);
    }catch(err){ setError(err.message || 'Resend failed'); }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="mb-6 text-sm sm:text-base text-gray-700">Enter the OTP sent to <strong className="text-indigo-600">{identifier}</strong></div>
      <OtpInput value={otp} onChange={setOtp} length={4} />
      {error && <div className="text-red-500 text-sm mt-3">{error}</div>}
      <div className="mt-6 flex gap-2">
        <button onClick={verify} disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 sm:py-3 rounded-lg font-semibold disabled:opacity-50 text-sm sm:text-base transition-colors hover:bg-indigo-700">{loading ? 'Verifying...' : 'Verify'}</button>
        <button onClick={onBack} className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base font-medium transition-colors">Back</button>
      </div>
      <div className="mt-4 text-xs sm:text-sm text-gray-600 flex items-center justify-between">
        <div>Resend in <span className="font-semibold text-indigo-600">{timer}s</span></div>
        <button onClick={resend} disabled={timer>0 || loading} className={`font-semibold transition-colors ${timer>0 || loading ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-700'}`}>Resend</button>
      </div>
    </div>
  );
};

export default OtpPage;
