import React, { useState } from 'react';
import { Search, X, Send } from 'lucide-react';
import AvatarImg from '../user/AvatarImg';

export default function ForwardModal({
  visible,
  message,
  contacts,
  onForward,
  onClose,
  API_BASE,
  currentUserId, // added so we can exclude self
}) {
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (visible && message) {
      console.log('ForwardModal opened for message:', message._id, 'Contacts:', contacts.length);
      console.log('Sample contact data:', contacts[0] && {
        _id: contacts[0]._id,
        username: contacts[0].username,
        displayName: contacts[0].displayName,
        avatar: contacts[0].avatar,
        phone: contacts[0].phone
      });
    }
  }, [visible, message, contacts]);

  if (!visible || !message) {
    console.log('ForwardModal hidden - visible:', visible, 'message:', !!message);
    return null;
  }

  // Exclude current user and also apply search filtering
  const filteredContacts = contacts
    .filter(c => String(c._id) !== String(currentUserId))
    .filter(c =>
      c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );

  const handleContactClick = (contact) => {
    onForward(message, contact);
    setSearchTerm('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Forward Message</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 py-8">
                <p>No contacts found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => handleContactClick(contact)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg transition-colors text-left group"
                  >
                    {/* Avatar - Using AvatarImg from sidebar (same as ContactsList) */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-[12px] overflow-hidden">
                        <AvatarImg
                          src={contact.avatar}
                          username={contact.displayName || contact.username}
                          size="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {contact.displayName || contact.username}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {contact.phone}
                      </p>
                    </div>

                    {/* Send Icon */}
                    <Send
                      size={18}
                      className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-600 mb-2">MESSAGE PREVIEW</p>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-sm text-slate-700 truncate">
                {message.text || (message.image?.path ? '🖼️ Image' : message.audio?.path ? '🎵 Voice' : 'Message')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
