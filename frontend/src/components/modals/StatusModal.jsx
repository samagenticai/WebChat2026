import React, { useState, useRef } from 'react';
import AvatarImg from '../user/AvatarImg';

export default function StatusModal({ isOpen, onClose, myProfile, API_BASE, token, statusList = [] }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // reset caption when choosing a new file
    setCaption('');

    if (/video/i.test(file.type)) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        if (video.duration > 30) {
          alert('Video must be less than 30 seconds');
          return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      };
      video.src = URL.createObjectURL(file);
    } else {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      if (caption) fd.append('caption', caption);
      const res = await fetch(`${API_BASE}/api/status/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        setSelectedFile(null);
        setPreview(null);
        setCaption('');
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white w-full h-full md:h-[85vh] md:max-w-6xl md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDE: Status List & My Status (Hamesha dikhega) */}
        <div className="w-full md:w-[400px] border-r border-slate-100 flex flex-col bg-slate-50/30">
          <div className="p-6 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Status</h2>
            <div className="flex gap-2">
               <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
               </button>
               <button onClick={onClose} className="md:hidden p-2 hover:bg-slate-100 rounded-full">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
            {/* My Status Section */}
            <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-all cursor-pointer group mb-6 shadow-sm bg-white/50 border border-slate-100" onClick={() => fileInputRef.current?.click()}>
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 overflow-hidden ring-2 ring-white shadow-md">
                   <AvatarImg src={myProfile?.avatar} username={myProfile?.username} size="w-full h-full" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-white group-hover:scale-110 transition-transform">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12h14"/></svg>
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900">My status</h4>
                <p className="text-xs text-slate-500">Tap to add status update</p>
              </div>
            </div>

            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] px-3 mb-3">Recent updates</p>
            
            {/* Status List Items (Mocked based on image) */}
            <div className="space-y-1">
              {['Sir Awais', 'Rao Faraz', 'Sir Usama'].map((name, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-100">
                   <div className="w-14 h-14 rounded-full p-[3px] border-2 border-emerald-500">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-200">
                         <img src={`https://i.pravatar.cc/150?u=${name}`} alt={name} className="w-full h-full object-cover" />
                      </div>
                   </div>
                   <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-[15px]">{name}</h4>
                      <p className="text-xs text-slate-400 font-medium">Today at 12:05 am</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Preview & Empty State (Mobile par hide ho jayega) */}
        <div className="hidden md:flex flex-1 bg-slate-50 items-center justify-center relative p-8">
           <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
           </button>

           <div className="max-w-md w-full text-center">
              {preview ? (
                <div className="bg-white p-4 rounded-[32px] shadow-2xl animate-in zoom-in-95">
                   <div className="aspect-[9/16] max-h-[500px] rounded-2xl overflow-hidden bg-black mb-4">
                      {selectedFile?.type.startsWith('video') ? (
                        <video src={preview} controls className="w-full h-full" />
                      ) : (
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                      )}
                   </div>
                   {/* caption field */}
                   <div className="mb-4">
                     <input
                       type="text"
                       value={caption}
                       onChange={e => setCaption(e.target.value)}
                       placeholder="Add a caption..."
                       className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                     />
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => {setPreview(null); setSelectedFile(null); setCaption('');}} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                      <button onClick={handleUpload} disabled={isUploading} className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50">
                        {isUploading ? 'Uploading...' : 'Post Status'}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 bg-white rounded-[28px] shadow-xl flex items-center justify-center mb-6">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20M2 12a10 10 0 0 1 20 0"/></svg>
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Share status updates</h3>
                   <p className="text-slate-500 font-medium mb-8">Share photos, videos and text that disappear after 24 hours.</p>
                   <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                      Choose Something to Share
                   </button>
                </div>
              )}
           </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );
}