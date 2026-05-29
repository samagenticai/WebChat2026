import React from 'react';

export default function MobileOverlay({ showSidebar, setShowSidebar, isDesktop }) {
  if (showSidebar && !isDesktop) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-20"
        onClick={() => setShowSidebar(false)}
      />
    );
  }
  return null;
}
