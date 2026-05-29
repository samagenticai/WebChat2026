import React from 'react';
import { Send, Crop, X, Smile, Type, Pencil } from 'lucide-react';

export default function UploadForm({
  preview,
  selectedFile,
  uploadTime,
  isUploading,
  setPreview,
  setUploadTime,
  handleUpload,
  handleCrop,
  caption,
  setCaption,
  userAvatar
}) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col h-full w-full z-[300] animate-in fade-in duration-200">

      {/* --- Top Action Bar --- */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPreview(null); setUploadTime(null); }}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-all active:scale-90"
          >
            <X size={26} />
          </button>
          {userAvatar && (
            <div className="w-8 h-8 rounded-full overflow-hidden ml-2">
              <img src={userAvatar} alt="you" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!selectedFile?.type.startsWith('video') && (
            <button
              onClick={handleCrop}
              className="p-2.5 text-white hover:bg-white/10 rounded-full transition"
              title="Crop image"
            >
              <Crop size={22} />
            </button>
          )}
          <button className="p-2.5 text-white hover:bg-white/10 rounded-full transition"><Smile size={22} /></button>
          <button className="p-2.5 text-white hover:bg-white/10 rounded-full transition"><Type size={22} /></button>
          <button className="p-2.5 text-white hover:bg-white/10 rounded-full transition"><Pencil size={22} /></button>
        </div>
      </div>

      {/* --- Main Media Preview --- */}
      <div className="flex-1 w-full flex items-center justify-center bg-black overflow-hidden">
        {selectedFile?.type.startsWith('video') ? (
          <video
            src={preview}
            controls={false}
            autoPlay
            muted
            loop
            className="w-full h-full object-contain"
          />
        ) : (
          <img src={preview} className="w-full h-full object-contain" alt="Preview" />
        )}
      </div>

      {/* --- Bottom Input & Send Area --- */}
      <div className="p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-8">
        <div className="max-w-[500px] mx-auto flex items-end gap-3">

          {/* Caption Input Field */}
          <div className="flex-1 bg-[#2a2a2a]/90 backdrop-blur-xl rounded-[28px] px-4 py-3 flex items-center shadow-2xl">
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="bg-transparent border-none focus:ring-0 text-white w-full text-[16px] placeholder:text-white/40"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`p-4 rounded-full transition-all shadow-xl active:scale-90 flex items-center justify-center ${isUploading ? 'bg-gray-600' : 'bg-[#00a884] hover:bg-[#008f72]'
              } text-white`}
          >
            {isUploading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={24} fill="currentColor" className="ml-1" />
            )}
          </button>
        </div>

        {/* Status Info Footer */}
        <div className="mt-4 flex justify-center">
          <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5">
            <p className="text-white/60 text-[11px] font-medium tracking-wide uppercase">
              Status (Contacts)
            </p>
          </div>
        </div>
      </div>

      {/* Time Badge Overlay */}
      {uploadTime && (
        <div className="absolute top-20 right-4">
          <span className="text-[11px] font-bold text-white/90 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
            {uploadTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}