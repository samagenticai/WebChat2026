import React from 'react';
import AvatarImg from '../user/AvatarImg';

export default function StatusAvatarCard({
  user,
  statusCount,
  totalViewers,
  onSelect,
  isSelected,
  API_BASE,
  latestStatusTime
}) {
  const getTimeFormat = (createdAt) => {
    if (!createdAt) return 'Posted';
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return 'Posted';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    // Less than 1 hour: show minutes ago
    if (minutes < 60) {
      if (seconds < 60) return 'Just now';
      return `${minutes}m ago`;
    }
    
    // 1 hour or more but same day: show actual time (e.g., "10:30 AM")
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    
    // More than 1 day but less than 7 days: show days ago
    if (days < 7) {
      return `${days}d ago`;
    }
    
    // More than 7 days: show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
        isSelected
          ? 'bg-indigo-100 border-2 border-indigo-600'
          : 'hover:bg-indigo-50/50 border-2 border-transparent'
      }`}
      onClick={onSelect}
    >
      {/* Avatar with Progress Bars for Multiple Statuses */}
      <div className="relative">
        {/* Progress Bars Above Avatar */}
        {statusCount > 1 && (
          <div className="absolute -top-2 left-0 right-0 flex gap-0.5 px-0.5">
            {Array.from({ length: statusCount }).map((_, idx) => (
              <div key={idx} className="h-0.5 flex-1 bg-indigo-400 rounded-full" />
            ))}
          </div>
        )}
        <div
          className="w-14 h-14 rounded-full overflow-hidden border-2 p-0.5"
          style={{
            borderColor: '#4f46e5'
          }}
        >
          <AvatarImg
            src={user.avatar}
            username={user.username}
            size="w-full h-full rounded-full"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1">
        <h4 className="font-bold text-slate-900 text-sm">{user.displayName || user.username}</h4>
        <p className="text-xs text-slate-500">
          {getTimeFormat(latestStatusTime)}
        </p>
      </div>
    </div>
  );
}