import React from 'react';

export default function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[250px]">
      <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-600">Welcome to your chat</h2>
      <p className="max-w-md text-sm mt-2 text-slate-500">
        You do not have an active conversation yet. Open the contacts sidebar or add a new contact to start chatting.
      </p>
    </div>
  );
}
