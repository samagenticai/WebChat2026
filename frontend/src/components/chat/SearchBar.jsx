import React from 'react';

export default function SearchBar({ contactSearch, setContactSearch }) {
  return (
    <div className="p-2 sm:p-3">
      <div className="relative">
        <input
          value={contactSearch}
          onChange={e => setContactSearch(e.target.value)}
          type="text"
          placeholder="Search..."
          className="w-full bg-slate-100 border-none rounded-xl px-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <svg
          className="absolute left-3 top-2.5 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
  );
}
