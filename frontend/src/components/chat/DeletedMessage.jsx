import React from 'react';
import { Ban } from 'lucide-react'; // Agar icons use kar rahe hain, warna bina icon ke bhi clean lagega

export default function DeletedMessage({ viewerId, senderId }) {
  const isSender = String(viewerId) === String(senderId);
  
  // WhatsApp accurate text
  const text = isSender
    ? 'You deleted this message'
    : 'This message was deleted';

  return (
    <div className={`flex w-full mb-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border max-w-[80%]
          ${isSender 
            ? 'bg-slate-50 border-slate-200 rounded-tr-none' 
            : 'bg-white border-gray-200 rounded-tl-none'
          }
        `}
      >
        {/* Subtle Block Icon */}
        <Ban size={14} className="text-slate-400" />
        
        <span className="text-[13.5px] italic text-slate-500 font-light select-none">
          {text}
        </span>
      </div>
    </div>
  );
}

