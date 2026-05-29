import React from 'react'

export default function AddContactModal({
  isOpen,
  onClose,
  onAddContact,
  identifier,
  setIdentifier,
  displayName,
  setDisplayName,
  message,
  isLoading
}) {
  if (!isOpen) return null;

  const handleAdd = () => {
    onAddContact();
  };

  const handleCancel = () => {
    setIdentifier('');
    setDisplayName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-800">New Contact</h3>
        <p className="text-slate-500 text-sm mb-6">Enter details to start a conversation.</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Identifier</label>
            <input 
              value={identifier} 
              onChange={e => setIdentifier(e.target.value)}
              disabled={isLoading}
              placeholder="Phone or Username" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base disabled:opacity-50" 
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Name (Optional)</label>
            <input 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)}
              disabled={isLoading}
              placeholder="Friendly name" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base disabled:opacity-50" 
            />
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${message.includes('Error') || message.includes('Failed') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
            {message}
          </div>
        )}
        
        <div className="flex gap-3 mt-8">
          <button 
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors text-sm sm:text-base disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleAdd}
            disabled={isLoading || !identifier}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
        