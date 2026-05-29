import React, { useRef, useEffect, useState } from 'react';

export default function ChatInput({
  text,
  onTextChange,
  send,
  recording,
  startRecording,
  stopRecording,
  triggerMobileCapture,
  fileInputRef,
  handleFileCapture,
  status,
  activeContact,
  API_BASE,
  token,
  messages,
  setMessages
  , showUserDetails
}) {
  // Container class: when details sidebar is open, use a small centered container
  // otherwise use the wide centered container used across the app
  const containerClass = showUserDetails ? 'max-w-sm mx-auto' : 'max-w-5xl mx-auto';
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null); // { kind: 'image'|'video', file, previewUrl }

  const emojiOptions = ['😊', '😂', '😍', '🎉', '😢', '🤔', '👍', '🔥', '⭐', '😎', '👌', '✨', '🎁', '😴 '];

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const uploadMedia = async (kind, file) => {
    if (!file) return;
    if (!activeContact) {
      alert('❌ Please select a contact first');
      return;
    }

    setUploading(true);
    setUploadLabel(kind === 'video' ? 'Uploading video...' : 'Uploading image...');
    try {
      const formData = new FormData();
      formData.append(kind, file);
      formData.append('recipientId', activeContact._id);

      const endpoint = kind === 'video' ? 'send-video' : 'send-image';
      const response = await fetch(`${API_BASE}/api/messages/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Server error ${response.status}`);

      if (data.message && typeof setMessages === 'function') {
        setMessages(prev => [...prev, data.message]);
      }
      setShowAttachMenu(false);
      setPendingMedia(null);
    } catch (err) {
      console.error(`[${kind} upload error]`, err);
      alert('❌ Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadLabel('');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert('❌ Please select an image file');
      return;
    }

    // Check file size (50MB limit frontend-side)
    if (file.size > 50 * 1024 * 1024) {
      alert('❌ Image file too large! Maximum 50MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingMedia({ kind: 'image', file, previewUrl });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert('❌ Please select a video file');
      return;
    }

    // Check file size (100MB limit frontend-side)
    if (file.size > 100 * 1024 * 1024) {
      alert('❌ Video file too large! Maximum 100MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingMedia({ kind: 'video', file, previewUrl });
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-lg border-t border-slate-200/60 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className={`${containerClass} flex items-end gap-2 sm:gap-4`}>
        
        {/* Attachment Button (Plus Icon) with Menu */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="mb-1 p-2.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all active:scale-90 border border-transparent hover:border-indigo-100 shadow-sm bg-white"
            title="Add Attachment"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {/* Attachment Menu */}
          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-40">
              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                disabled={uploading}
                className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 transition-colors text-sm disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Share Image
              </button>
              <button
                onClick={() => {
                  videoInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                disabled={uploading}
                className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 transition-colors text-sm disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                Share Video
              </button>
              <button
                onClick={() => {
                  if (recording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                  setShowAttachMenu(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors text-sm ${
                  recording 
                    ? 'bg-red-50 border-b border-red-200 text-red-700 hover:bg-red-100' 
                    : 'text-slate-700 hover:bg-slate-50 border-b border-slate-100'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                {recording ? 'Stop Recording' : 'Voice Message'}
              </button>
            </div>
          )}
        </div>

        {/* Main Input Container */}
        <div className="flex-1 flex items-end bg-slate-100/80 rounded-[20px] border border-transparent focus-within:border-indigo-200 focus-within:bg-white focus-within:shadow-sm transition-all px-4 py-2">
          
          <textarea
            ref={textareaRef}
            rows="1"
            value={text}
            onChange={onTextChange}
            onKeyDown={e => { 
              if(e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                send(); 
              } 
            }}
            placeholder="Write a message..."
            className="w-full bg-transparent border-none py-1.5 text-[15px] text-slate-700 focus:ring-0 resize-none outline-none leading-relaxed custom-scrollbar placeholder:text-slate-400"
          />

          {/* Emoji Button with Picker */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"
              title="Add emoji"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-6 sm:h-6"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            
            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-2 grid grid-cols-4 gap-1 w-48">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onTextChange({ target: { value: text + emoji } });
                      setShowEmojiPicker(false);
                    }}
                    className="text-xl hover:bg-gray-100 p-1.5 rounded hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Voice & Send) */}
        <div className="flex items-center gap-2 mb-0.5">
          <input ref={fileInputRef} type="file" accept="audio/*" capture="microphone" onChange={handleFileCapture} className="hidden" />
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={uploading} />

          {/* Voice Record Button (Visible only when text is empty) */}
          {!text.trim() && (
            <button
              onClick={() => {
                const hasMedia = !!(navigator?.mediaDevices?.getUserMedia);
                if (hasMedia && window.isSecureContext) {
                  recording ? stopRecording() : startRecording();
                } else {
                  triggerMobileCapture();
                }
              }}
              className={`p-3 rounded-2xl transition-all duration-300 active:scale-75 ${
                recording 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100/50'
              }`}
            >
              {recording ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              )}
            </button>
          )}

          {/* Send Button (Visible when typing or recording) */}
          {(text.trim() || recording) && (
            <button
              onClick={send}
              className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:rotate-12 transition-all active:scale-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Status/Error message below input */}
      {status && <div className={`${containerClass} px-4 mt-2 text-[11px] font-bold text-red-500 uppercase tracking-wider`}>{status}</div>}
      {uploading && <div className={`${containerClass} px-4 mt-2 text-[11px] font-bold text-blue-500 uppercase tracking-wider`}>{uploadLabel || 'Uploading...'}</div>}

      {/* Media Preview Modal */}
      {pendingMedia && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPendingMedia(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-slate-800">Send {pendingMedia.kind}</div>
              <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setPendingMedia(null)}>✕</button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              {pendingMedia.kind === 'image' ? (
                <img src={pendingMedia.previewUrl} alt="preview" className="max-h-[55vh] w-auto rounded-lg object-contain" />
              ) : (
                <video src={pendingMedia.previewUrl} controls playsInline className="max-h-[55vh] w-full rounded-lg" />
              )}
            </div>
            <div className="p-4 flex gap-3">
              <button
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                onClick={() => setPendingMedia(null)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                onClick={() => uploadMedia(pendingMedia.kind, pendingMedia.file)}
                disabled={uploading}
              >
                {uploading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}