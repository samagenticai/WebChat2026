import React, { useState } from 'react';

export default function AddContactPage({
  onClose,
  onAddContact,
  apiBase,
  token,
  userId,
  navigate
}) {
  const [identifier, setIdentifier] = useState('');
  const [firstName, setFirstName] = useState(''); // Mapping to your UI
  const [lastName, setLastName] = useState('');   // Mapping to your UI
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Logic to combine names for the backend
  const handleAdd = async () => {
    const fullDisplayName = `${firstName} ${lastName}`.trim();
    
    if (!identifier.trim()) {
      setMessage('Please enter phone number');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${apiBase}/api/users/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          displayName: fullDisplayName || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Failed to add contact');
        setIsLoading(false);
        return;
      }

      setMessage('Contact added successfully!');
      setTimeout(() => {
        setIdentifier('');
        setFirstName('');
        setLastName('');
        onAddContact && onAddContact();
        onClose && onClose();
        navigate && navigate('/chat');
      }, 1000);
    } catch (err) {
      setMessage('Error: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose && onClose();
    navigate && navigate('/chat');
  };

  return (
    <div className="flex h-screen w-full bg-white font-bold text-[#757575]">
      {/* LEFT SIDE: FORM */}
      <div className="w-full md:w-[350px] flex flex-col border-r border-gray-100">
        {/* Header */}
        <div className="flex items-center px-4 py-3">
          <button onClick={handleCancel} className="mr-4 text-gray-800">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-sans text-gray-800">New contact</h1>
        </div>

        <div className="flex-1 px-6 py-8 space-y-10">
          {/* First Name */}
          <div className="relative flex items-center">
            <div className="mr-6 text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="flex-1 border-b border-gray-400 focus-within:border-teal-600 transition-colors">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full py-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
              />
            </div>
          </div>

          {/* Last Name (Placeholder for UI) */}
          <div className="relative flex items-center pl-[44px]">
            <div className="flex-1 border-b border-gray-400 focus-within:border-teal-600 transition-colors">
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full py-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
              />
            </div>
          </div>

          {/* Phone Input Area */}
          <div className="relative flex items-start">
            <div className="mr-6 mt-2 text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </div>
            <div className="flex-1 flex gap-4">
              <div className="w-24 border-b border-gray-400">
                <label className="text-[10px] block text-gray-500">Country</label>
                <div className="flex items-center justify-between py-1 text-sm text-gray-800">
                  <span>PK +92</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </div>
              <div className="flex-1 border-b border-gray-400 focus-within:border-teal-600">
                <label className="text-[10px] block text-gray-500">Phone</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full py-1 outline-none text-gray-800 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sync Toggle Area */}
          <div className="relative flex items-start pl-[44px]">
            <div className="flex-1 pr-4">
              <h3 className="text-sm text-gray-800">Sync contact to phone</h3>
              <p className="text-[11px] leading-tight mt-1">This contact will be added to your phone's address book.</p>
            </div>
            <div className="mt-1">
               {/* Custom Toggle Switch */}
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[-2px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-200 peer-checked:after:bg-teal-600"></div>
               </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 pl-[44px]">
             <button 
                onClick={handleAdd}
                disabled={isLoading}
                className="bg-teal-600 text-white px-6 py-2 rounded-md text-sm font-sans hover:bg-teal-700 transition-all disabled:opacity-50"
             >
                {isLoading ? 'Saving...' : 'Save Contact'}
             </button>
             {message && <p className="mt-2 text-xs text-teal-600">{message}</p>}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: STATUS PLACEHOLDER (Like Image) */}
      <div className="hidden md:flex flex-1 bg-[#f0f2f5] items-center justify-center text-center p-12">
        <div className="max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 border-4 border-gray-300 rounded-full flex items-center justify-center">
               <div className="w-12 h-12 border-2 border-gray-300 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-[32px] font-sans text-[#41525d] mb-4">Create new user profile</h2>
          <p className="text-[#667781] text-sm mb-12">
           Save new user information securely
          </p>
          <div className="flex items-center justify-center text-[#8696a0] text-xs">
            <svg className="mr-2" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
  User data is stored with advanced security protection
          </div>
        </div>
      </div>
    </div>
  );
}