import React from 'react';

export default function DeleteConfirmModal({
  visible,
  count = 1,
  onCancel,
  onDeleteMe,
  onDeleteEveryone,
  allowEveryone = true, // hide button when false
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      {/* WhatsApp Style Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />

      {/* Modern Compact Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5">
          {/* Minimal Title */}
          <h3 className="text-[17px] font-medium text-slate-800 mb-6">
            {count === 1 ? 'Delete message?' : `Delete ${count} messages?`}
          </h3>

          {/* Action Stack - Clean & Professional */}
          <div className="flex flex-col gap-1">
            {allowEveryone && (
              <button
                onClick={onDeleteEveryone}
                className="w-full text-right sm:text-right px-2 py-2.5 text-[#008069] font-semibold text-[15px] hover:bg-slate-50 rounded-lg active:bg-slate-100 transition-colors"
              >
                Delete for everyone
              </button>
            )}
            
            <button
              onClick={onDeleteMe}
              className="w-full text-right sm:text-right px-2 py-2.5 text-[#008069] font-semibold text-[15px] hover:bg-slate-50 rounded-lg active:bg-slate-100 transition-colors"
            >
              Delete for me
            </button>

            <button
              onClick={onCancel}
              className="w-full text-right sm:text-right px-2 py-2.5 text-[#008069] font-semibold text-[15px] hover:bg-slate-50 rounded-lg active:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}