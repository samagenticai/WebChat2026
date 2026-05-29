import React from 'react'

export default function SettingsModal({ isOpen, onClose, userId, apiBase }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">Settings</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Profile Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-3">Profile</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-slate-700">
                <strong>User ID:</strong>{' '}
                <span className="font-mono text-[10px] sm:text-xs text-slate-500 break-all">{userId}</span>
              </p>
            </div>
          </div>

          {/* App Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-3">App</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-slate-700">
                <strong>API Host:</strong>{' '}
                <span className="text-[10px] sm:text-xs text-slate-500 break-all">{apiBase}</span>
              </p>
              <p className="text-slate-700">
                <strong>Version:</strong> <span className="text-[10px] sm:text-xs text-slate-500">1.0.0</span>
              </p>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-3">Notifications</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-xs sm:text-sm text-slate-700">Enable message notifications</span>
            </label>
          </div>

          {/* Theme Setting */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-3">Theme</h4>
            <div className="flex gap-3">
              <button className="flex-1 px-3 py-2 bg-white border-2 border-indigo-600 text-slate-700 rounded-lg text-xs sm:text-sm font-medium">Light</button>
              <button className="flex-1 px-3 py-2 bg-slate-700 text-white border-2 border-slate-700 rounded-lg text-xs sm:text-sm font-medium">Dark</button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
