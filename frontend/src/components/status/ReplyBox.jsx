import React from 'react';

export default function ReplyBox({ replyText, onChange, onSend, isSending }) {
  return (
    <div className="absolute bottom-0 right-0 w-full md:w-80 bg-white/90 backdrop-blur-sm p-4 flex flex-col gap-2">
      <textarea
        value={replyText}
        onChange={e => onChange(e.target.value)}
        placeholder="Write a reply..."
        className="w-full h-24 p-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <button
        onClick={onSend}
        disabled={isSending || !replyText.trim()}
        className="self-end px-4 py-2 bg-indigo-600 text-white rounded-full disabled:bg-indigo-300 disabled:cursor-not-allowed transition"
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}