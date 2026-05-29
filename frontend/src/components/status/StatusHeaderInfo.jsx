import React from 'react';
import AvatarImg from '../user/AvatarImg';

export default function StatusHeaderInfo({
    user,
    createdAt,
    caption,
    viewerCount
}) {
    return (
        <div className="flex items-center gap-3 w-full">
            {/* Avatar with subtle border */}
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 shadow-sm flex-shrink-0">
                <AvatarImg 
                    src={user.avatar} 
                    username={user.username} 
                    size="w-full h-full object-cover" 
                />
            </div>

            {/* User Info */}
            <div className="flex flex-col min-w-0">
                <h3 className="text-white font-bold text-[15px] leading-tight truncate drop-shadow-sm">
                    {user.displayName || user.username}
                </h3>
                <p className="text-white/80 text-[12px] font-medium tracking-wide">
                    {createdAt
                        ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                        : 'Just Now'}
                </p>
                {caption && (
                    <p className="text-white/70 text-[11px] truncate mt-1">
                        {caption}
                    </p>
                )}
            </div>

            {/* Viewer Count Pill (WhatsApp Style) */}
            {viewerCount !== undefined && (
                <div className="ml-auto flex items-center gap-1.5 bg-black/20 backdrop-blur-lg border border-white/10 px-3 py-1 rounded-full transition-all">
                    <span className="text-[11px] text-white font-bold tracking-tighter uppercase opacity-90">
                        {viewerCount} Views
                    </span>
                </div>
            )}
        </div>
    );
}