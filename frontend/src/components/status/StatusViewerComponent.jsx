import React from 'react';
import { ArrowLeft, X, Send, Smile, Paperclip, MoreVertical, Eye } from 'lucide-react';
import StatusHeaderInfo from './StatusHeaderInfo';

export default function StatusViewerComponent({
  selectedStatusUser,
  selectedStatusIndex,
  currentStatus,
  statusViewers,
  onSetStatusUser,
  onSetStatusIndex,
  onDeleteStatus,
  videoRef,
  API_BASE,
  handleNextStatus,
  progress,
  myProfile // Assuming you pass this to check ownership
}) {
  if (!selectedStatusUser) return null;

  const isOwner = myProfile && selectedStatusUser.user?._id === myProfile._id;

  return (
    <div className="fixed inset-0 z-[150] bg-[#0b141a] md:bg-[#111b21] flex items-center justify-center overflow-hidden font-sans">
      
      {/* 1. Desktop Background Blur (Ref: image_4a9f03.jpg) */}
      <div className="hidden md:block absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src={`${API_BASE}${currentStatus?.filePath}`} 
          className="w-full h-full object-cover blur-3xl opacity-50 scale-110" 
          alt="bg-blur" 
        />
      </div>

      {/* 2. Close Button (Desktop Top-Right) */}
      <button 
        onClick={() => onSetStatusUser(null)}
        className="hidden md:flex absolute top-6 right-8 z-[200] text-white/70 hover:text-white transition"
      >
        <X size={32} />
      </button>

      {/* 3. Main Content Container (Mobile Responsive) */}
      <div className="relative w-full h-full md:h-[92vh] md:max-w-[420px] md:rounded-2xl bg-black flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
        
        {/* Progress Bars (Top) */}
        <div className="absolute top-3 left-0 right-0 flex gap-1.5 px-3 z-[100]">
          {selectedStatusUser.statuses.map((_, idx) => (
            <div key={idx} className="h-[2px] flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_8px_white]"
                style={{ 
                  width: idx < selectedStatusIndex ? '100%' : idx === selectedStatusIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header - User Info */}
        <div className="absolute top-7 left-0 right-0 px-4 flex items-center justify-between z-[100] bg-gradient-to-b from-black/60 to-transparent pb-10">
          <div className="flex items-center gap-3">
            <button onClick={() => onSetStatusUser(null)} className="text-white hover:bg-white/10 p-1 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <StatusHeaderInfo
              user={selectedStatusUser.user}
              createdAt={currentStatus?.createdAt}
              caption={currentStatus?.caption}
            />
          </div>
          
          <button className="text-white/80 hover:text-white p-2">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Media Content Area (Anti-Zoom Layout) */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {currentStatus?.fileType === 'video' ? (
            <video
              ref={videoRef}
              key={currentStatus?.filePath}
              src={`${API_BASE}${currentStatus?.filePath}`}
              autoPlay
              muted
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <img 
              src={`${API_BASE}${currentStatus?.filePath}`} 
              className="max-w-full max-h-full object-contain select-none" 
              alt="Status"
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          {/* Navigation Tap Zones */}
          <div className="absolute inset-0 flex z-10">
            <div className="w-1/3 h-full cursor-pointer" onClick={() => onSetStatusIndex(Math.max(0, selectedStatusIndex - 1))} />
            <div className="w-2/3 h-full cursor-pointer" onClick={() => handleNextStatus()} />
          </div>
        </div>

        {/* 4. Bottom Interactive Area (Ref: image_4a9f03.jpg & image_5759ad.jpg) */}
        <div className="relative p-4 pb-8 md:pb-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[100]">
          
          {/* Owner View: Show Viewers Count */}
          {isOwner ? (
            <div className="flex flex-col items-center gap-1.5 group cursor-pointer transition-transform active:scale-95">
               <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-full border border-white/10 group-hover:bg-white/20 transition">
                  <Eye size={22} className="text-white" />
               </div>
               <span className="text-[11px] text-white font-bold tracking-[0.15em] uppercase opacity-80">
                 {statusViewers.length} Views
               </span>
            </div>
          ) : (
            /* Viewer View: Professional Reply Bar */
            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-4">
              <div className="flex-1 flex items-center gap-3 bg-[#2a3942]/95 backdrop-blur-xl rounded-full px-4 py-2.5 border border-white/5 shadow-2xl">
                <Smile className="text-white/50 cursor-pointer hover:text-[#00a884] transition" size={22} />
                <Paperclip className="text-white/50 cursor-pointer hover:text-white transition -rotate-45" size={20} />
                <input 
                  type="text" 
                  placeholder="Type a reply..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[15px] placeholder:text-white/30 outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button className="bg-[#00a884] hover:bg-[#06cf9c] text-white p-3.5 rounded-full shadow-lg transition-all active:scale-90 flex items-center justify-center">
                <Send size={20} className="ml-0.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
} 