import React from 'react'

export default function ImageViewer({
  isOpen,
  onClose,
  imageUrl,
  userName
}) {
  if (!isOpen || !imageUrl) return null;
  const isVideo = /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(String(imageUrl));

  return (
    <div 
      className="fixed inset-0 bg-slate-900/90 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Media Container */}
      <div 
        className="flex items-center justify-center max-w-[90vh] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video src={imageUrl} controls className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        ) : (
          <img 
            src={imageUrl}
            alt={userName || 'User media'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Info */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="text-white text-sm opacity-70">
          {userName && `${userName}'s profile photo`}
        </p>
      </div>
    </div>
  );
}
