import React from 'react';

export default function AvatarImg({ src, username = 'U', size = 'w-8 h-8', className = '' }) {
  const [failed, setFailed] = React.useState(false);

  if (failed || !src) {
    const initial = (username || 'U')[0].toUpperCase();
    return (
      <div className={`${size} rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0 ${className}`}>
        <span className="flex items-center justify-center w-full h-full text-center leading-none mt-[2px]">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={username}
      className={`${size} rounded-full object-cover flex-shrink-0 ${className}`}
      onError={() => {
        console.warn('[avatar] Image failed to load:', src);
        setFailed(true);
      }}
    />
  );
}
