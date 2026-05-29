import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, MoreVertical, Volume2, VolumeX, Trash2 } from 'lucide-react';
import AvatarImg from '../user/AvatarImg';

export default function MyStatusViewerComponent({
  selectedStatusUser,
  selectedStatusIndex,
  currentStatus,
  statusViewers,
  statusReplies,
  onSetStatusUser,
  onSetStatusIndex,
  onDeleteStatus,
  videoRef,
  API_BASE,
  handleNextStatus,
  progress
}) {
  const safeStatuses = selectedStatusUser?.statuses || [];
  const viewers = statusViewers || [];
  const safeIndex = typeof selectedStatusIndex === 'number' ? selectedStatusIndex : 0;
  const safeCurrent = currentStatus || safeStatuses[safeIndex] || {};

  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef && videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, videoRef]);

  if (!selectedStatusUser || safeStatuses.length === 0) return null;

  return (
    <div className="fixed inset-0 z-100 bg-[#0b141a] flex flex-col md:flex-row items-center justify-center overflow-hidden">

      {/* 1. Close Button (Desktop Only - Top Right) */}
      <button
        onClick={() => onSetStatusUser(null)}
        className="hidden md:block absolute top-6 right-6 text-white/70 hover:text-white z-110"
      >
        <X size={32} />
      </button>

      {/* 2. MAIN VIEWER CONTAINER */}
      <div className="relative w-full h-full md:h-screen md:aspect-9/16 bg-black flex flex-col shadow-2xl overflow-hidden md:rounded-lg">

        {/* Progress Bars Overlay */}
        <div className="absolute top-0 left-0 right-0 pt-3 pb-8 px-2 flex gap-1 z-110 bg-linear-to-b from-black/60 to-transparent">
          {safeStatuses.map((_, idx) => (
            <div key={idx} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < safeIndex ? '100%' : idx === safeIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Overlay */}
        <div className="absolute top-6 left-0 right-0 px-4 flex items-center justify-between z-110">
          <div className="flex items-center gap-3">
            <button onClick={() => onSetStatusUser(null)} className="p-1 text-white hover:bg-white/10 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 ring-1 ring-white/10">
              <AvatarImg src={selectedStatusUser?.user?.avatar} username={selectedStatusUser?.user?.username} size="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight">
                {selectedStatusUser?.user?.displayName || selectedStatusUser?.user?.username || "You"}
              </h3>
              <p className="text-white/70 text-[11px]">
                {safeCurrent?.createdAt ? `Uploaded at ${new Date(safeCurrent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Today'}
              </p>
              {safeCurrent.caption && (
                <p className="text-white/70 text-[10px] truncate mt-1">
                  {safeCurrent.caption}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/90">
            {/* volume toggle */}
            {safeCurrent.fileType === 'video' && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/10 rounded-full transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
            )}
            {/* Delete status */}
            <button onClick={() => onDeleteStatus(safeCurrent._id)} className="p-2 hover:bg-red-500/20 rounded-full transition">
              <Trash2 size={22} title="Delete Status" className="text-red-400" />
            </button>
          </div>
        </div>
        {safeCurrent.caption && (
          <div className="absolute top-20 left-4 right-4 text-white text-sm bg-black/50 rounded px-2 py-1">
            {safeCurrent.caption}
          </div>
        )}

        {/* MEDIA CONTENT */}
        <div className="flex-1 w-full h-full relative flex items-center justify-center bg-[#0b141a]">
          {safeCurrent.fileType === 'video' ? (
            <video
              ref={videoRef}
              key={safeCurrent.filePath}
              src={`${API_BASE}${safeCurrent.filePath}`}
              autoPlay
              muted={isMuted}
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <img
              src={`${API_BASE}${safeCurrent.filePath}`}
              alt="Status"
              className="max-w-full max-h-full object-contain"
            />
          )}

          {/* Navigation Tap Zones */}
          <div className="absolute inset-0 flex z-105">
            <div
              className="w-[30%] h-full cursor-pointer"
              onClick={() => onSetStatusIndex(Math.max(0, safeIndex - 1))}
            />
            <div
              className="flex-1 h-full cursor-pointer"
              onClick={() => handleNextStatus()}
            />
          </div>
        </div>

        {/* VIEWERS DRAWER (WhatsApp Style) */}
        <div className="absolute bottom-0 left-0 right-0 z-110 flex flex-col items-center">
          {/* Minimal Viewer Tab */}
          <div className="flex flex-col items-center pb-4 cursor-pointer group w-full bg-linear-to-t from-black/80 to-transparent pt-10">
            <div className="flex items-center gap-1.5 text-white bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/20 transition">
              <span className="text-sm font-medium">👁️ {viewers.length}</span>
            </div>
          </div>

          {/* Viewers List - Expansion Logic can be added here */}
          {viewers.length > 0 && (
            <div className="hidden group-hover:flex flex-col w-full max-h-[30vh] bg-[#111b21] rounded-t-2xl p-4 overflow-y-auto border-t border-white/10">
              <p className="text-[#8696a0] text-xs font-semibold mb-3 uppercase tracking-wider">Viewed by</p>
              {viewers.map((viewer, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                    <AvatarImg src={viewer.userId?.avatar} username={viewer.userId?.username} size="w-full h-full" />
                  </div>
                  <span className="text-white text-sm">{viewer.userId?.displayName || viewer.userId?.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REPLIES OVERLAY (Optional floating style) */}
        {statusReplies && statusReplies.length > 0 && (
          <div className="absolute left-4 bottom-20 right-4 max-h-50 overflow-y-auto space-y-2 z-115">
            {statusReplies.slice(-3).map((reply, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/5 max-w-[80%] animate-in slide-in-from-bottom-2">
                <p className="text-[10px] text-green-400 font-bold">{reply.sender?.username}</p>
                <p className="text-white text-xs">{reply.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}