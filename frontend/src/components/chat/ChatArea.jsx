import React, { useState, useMemo, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import MessageInfoModal from './MessageInfoModal';
import ForwardModal from '../modals/ForwardModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import EmptyState from '../../utils/EmptyState';

export default function ChatArea({
  activeContact,
  myProfile,
  isContactOnline,
  typingUsers,
  setShowSidebar,
  handleOpenUserDetails,
  getContactStatusWithDateTime,
  messages,
  setMessages, // allow parent to update messages
  onLocalDelete,
  userId,
  scrollRef,
  API_BASE,
  wallpaperUrl,
  onChangeWallpaper,
  groupSubtitle,
  text,
  onTextChange,
  send,
  recording,
  startRecording,
  stopRecording,
  triggerMobileCapture,
  fileInputRef,
  handleFileCapture,
  status,
  token,
  onImageClick,
  replyingTo,
  setReplyingTo,
  selectedMessages,
  setSelectedMessages,
  isSelectionMode,
  setIsSelectionMode,
  pinnedMessages,
  setPinnedMessages,
  contacts = [],
  showUserDetails,
  onSaveContact,
  isSavedContact,
  getSavedContactName,
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoData, setInfoData] = useState(null);
  const [forwardVisible, setForwardVisible] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ visible: false, ids: [], allowEveryone: true });

  // Robust body scroll lock: freeze scroll by fixing body position and restore on unlock
  const scrollLockRef = useRef(0);
  useEffect(() => {
    const locked = isSelectionMode || infoVisible || forwardVisible || (deleteModal && deleteModal.visible);
    if (locked) {
      scrollLockRef.current = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollLockRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      // additionally prevent touch gestures on html element
      document.documentElement.style.touchAction = 'none';
    } else {
      // restore
      const y = scrollLockRef.current || 0;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.documentElement.style.touchAction = '';
      window.scrollTo(0, y);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.documentElement.style.touchAction = '';
    };
  }, [isSelectionMode, infoVisible, forwardVisible, deleteModal]);

  React.useEffect(() => {
    console.log('Forward state:', { forwardVisible, hasMessage: !!forwardingMessage, contacts: contacts.length });
  }, [forwardVisible, forwardingMessage, contacts.length]);

  // Get last selected message (most recent) for Info/Copy/Pin actions
  const selectedArray = Array.from(selectedMessages || []);
  const lastSelectedId = selectedArray[selectedArray.length - 1];
  const lastSelectedMessage = useMemo(() => {
    return messages.find(m => m._id === lastSelectedId);
  }, [lastSelectedId, messages]);

  // Show Info only when exactly one message is selected AND that message is from the current user
  const showInfoSingleSender = useMemo(() => {
    if (selectedArray.length !== 1) return false;
    const msg = lastSelectedMessage;
    return Boolean(msg && String(msg?.sender?._id) === String(userId));
  }, [selectedArray.length, lastSelectedMessage, userId]);

  const handleCopy = async () => {
    if (lastSelectedMessage?.text) {
      try {
        await navigator.clipboard.writeText(lastSelectedMessage.text);
        console.log('Copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
    setShowMoreMenu(false);
  };

  const handlePin = async () => {
    if (!lastSelectedMessage) return;
    try {
      const isPinned = pinnedMessages.some(m => m._id === lastSelectedMessage._id);

      if (isPinned) {
        // Unpin
        setPinnedMessages(prev => prev.filter(m => m._id !== lastSelectedMessage._id));
      } else {
        // Pin
        setPinnedMessages(prev => [...prev, lastSelectedMessage]);
      }

      setShowMoreMenu(false);
      setIsSelectionMode(false);
      setSelectedMessages(new Set());

      console.log(isPinned ? 'Message unpinned' : 'Message pinned');
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  const handleDeleteMessages = (ids) => {
    console.log('handleDeleteMessages called with', ids);
    if (!ids || ids.length === 0) return;
    // only allow "everyone" deletion if all selected messages were sent by me
    const allowEveryone = ids.every(i => {
      const msg = messages.find(m => m._id === i);
      return msg && String(msg.sender?._id) === String(userId);
    });
    setDeleteModal({ visible: true, ids, allowEveryone });
  };

  const confirmDelete = async (everybody) => {
    const ids = deleteModal.ids;
    setDeleteModal({ visible: false, ids: [] });

    try {
      if (token) {
        await fetch(`${API_BASE}/api/messages/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ messageIds: ids, forEveryone: !!everybody })
        });
      }
    } catch (err) {
      console.error('[delete] API error:', err);
    } finally {
      if (typeof setMessages === 'function') {
        setMessages(prev => prev
          .map(m => {
            if (!ids.includes(m._id)) return m;
            if (everybody) {
              return { ...m, deletedForEveryone: true, text: '', image: { path: '', mime: '' }, video: { path: '', mime: '' }, audio: { path: '', mime: '' } };
            }
            // delete for me: hide instantly
            return { ...m, __deletedForMeLocal: true };
          })
          .filter(m => !m.__deletedForMeLocal)
        );
      }

      if (typeof onLocalDelete === 'function') {
        onLocalDelete(ids, everybody);
      }
    }

    setPinnedMessages(prev => prev.filter(m => !ids.includes(m._id)));
    setIsSelectionMode(false);
    setSelectedMessages(new Set());
    setShowMoreMenu(false);
  };

  const handleInfo = () => {
    if (lastSelectedMessage) {
      setInfoData(lastSelectedMessage);
      setInfoVisible(true);
    }
    setShowMoreMenu(false);
  };

  const handleReply = () => {
    if (selectedArray.length === 1 && lastSelectedMessage) {
      setReplyingTo(lastSelectedMessage);
      setIsSelectionMode(false);
      setSelectedMessages(new Set());
    }
  };

  const handleForwardClick = (message) => {
    if (message) {
      setForwardingMessage(message);
      setForwardVisible(true);
      console.log('Forward modal opened for message:', message._id);
    }
  };

  const handleForwardMessage = async (message, targetContact) => {
    try {
      console.log(`Forwarding message "${message.text || 'media'}" to ${targetContact.username}`);

      // Send to the target contact
      const payload = {
        text: message.text,
        recipientId: targetContact._id,
        image: message.image || null,
        audio: message.audio || null,
      };

      const response = await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to forward message');

      console.log('Message forwarded successfully');
      setForwardVisible(false);
      setForwardingMessage(null);
      setShowMoreMenu(false);
      setIsSelectionMode(false);
      setSelectedMessages(new Set());
    } catch (err) {
      console.error('Forward error:', err);
      alert('Failed to forward message');
    }
  };

  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] border-l border-slate-100 px-6 py-10 text-center">
        <EmptyState />
      </div>
    );
  }

  return (
    // Main container with flexbox layout: header sticky at top, input fixed at bottom, messages scroll in middle
    <div className="flex flex-col h-full w-full bg-[#f0f2f5] relative overflow-hidden">

      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url('https://www.transparenttextures.com/patterns/graphy.png')`,
          zIndex: 0
        }}
      />

      {/* 1. Header - Sticky at Top */}
      {!isSelectionMode && (
        <header className="sticky top-0 z-50 flex-shrink-0 bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/60">
          <ChatHeader
            activeContact={activeContact}
            myProfile={myProfile}
            isContactOnline={isContactOnline}
            typingUsers={typingUsers}
            setShowSidebar={setShowSidebar}
            handleOpenUserDetails={handleOpenUserDetails}
            getContactStatusWithDateTime={getContactStatusWithDateTime}
            onChangeWallpaper={onChangeWallpaper}
            groupSubtitle={groupSubtitle}
            onSaveContact={onSaveContact}
            isSavedContact={isSavedContact}
            getSavedContactName={getSavedContactName}
          />
        </header>
      )}

      {/* Mobile Selection Toolbar */}
      {isSelectionMode && (
        <header className="sticky top-0 z-50 flex-shrink-0 bg-indigo-600 text-white shadow-lg animate-slide-down">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedMessages(new Set());
                }}
                className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
                title="Back"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-lg font-semibold">{selectedMessages.size} selected</span>
            </div>
            <div className="flex items-center gap-1">
              {selectedMessages.size === 1 && (
                <button
                  onClick={handleReply}
                  className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
                  title="Reply">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 19l-7-7 7-7" /><path d="M3 12h11a4 4 0 0 1 4 4v3" /></svg>
                </button>
              )}
              {selectedMessages.size === 1 && (
                <button
                  onClick={() => {
                    const selectedId = Array.from(selectedMessages)[0];
                    const msg = messages.find(m => m._id === selectedId);
                    if (msg) {
                      handleForwardClick(msg);
                    }
                  }}
                  className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
                  title="Forward">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12" /></svg>
                </button>
              )}
              <button
                onClick={() => handleDeleteMessages(Array.from(selectedMessages))}
                className="p-2 hover:bg-indigo-700 rounded-lg transition-colors" title="Delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(!showMoreMenu);
                  }}
                  className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
                  title="More"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                </button>

                {/* Professional Three-dot Menu */}
                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 bg-white text-slate-800 rounded-lg shadow-xl z-50 overflow-hidden border border-slate-200"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        minWidth: '200px',
                        animation: 'fadeInScale 0.15s ease-out',
                      }}>
                      <style>{`
                        @keyframes fadeInScale {
                          from {
                            opacity: 0;
                            transform: scale(0.95) translateY(-8px);
                          }
                          to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                          }
                        }
                      `}</style>

                      {/* Copy */}
                      <button
                        onClick={handleCopy}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium border-b border-slate-100 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                        Copy Text
                      </button>

                      {/* Pin */}
                      <button
                        onClick={handlePin}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium border-b border-slate-100 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17V5m0 0L7 10m5-5l5 5" /></svg>
                        Pin Message
                      </button>

                      {/* Info - Only when exactly one selected message is from sender */}
                      {showInfoSingleSender && (
                        <button
                          onClick={handleInfo}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                          Message Info
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Pinned Messages Section */}
      {(pinnedMessages && pinnedMessages.length > 0) && (
        <div className="sticky top-16 z-40 flex-shrink-0 bg-amber-50 border-b-2 border-amber-200 overflow-y-auto max-h-32">
          <style>{`
            @keyframes highlightFlash {
              0% { 
                background-color: #fef08a; 
                border-color: #fbbf24;
                box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
              }
              100% { 
                background-color: initial; 
                border-color: initial;
                box-shadow: none;
              }
            }
            .highlight-pin {
              animation: highlightFlash 2s ease-out;
              border: 2px solid #fbbf24 !important;
            }
          `}</style>
          <div className="p-2 space-y-1">
            {pinnedMessages.map((msg) => (
              <div
                key={msg._id}
                className="flex items-center justify-between bg-white rounded-lg p-2 border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-50 transition-colors"
                onClick={() => {
                  // Find the original message element
                  const msgElement = document.querySelector(`[data-message-id="${msg._id}"]`);
                  if (msgElement && scrollRef.current) {
                    // Scroll into view with smooth animation
                    msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Add highlight animation
                    msgElement.classList.add('highlight-pin');

                    // Remove highlight after animation completes
                    setTimeout(() => {
                      msgElement.classList.remove('highlight-pin');
                    }, 2000);
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-900 mb-1">📌 Pinned Message</p>
                  <p className="text-sm text-slate-700 truncate">
                    {msg.text || (msg.image?.path ? '🖼️ Image' : msg.audio?.path ? '🎵 Voice' : 'Message')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinnedMessages(prev => prev.filter(m => m._id !== msg._id));
                  }}
                  className="ml-2 p-1 hover:bg-amber-100 rounded text-amber-700 flex-shrink-0"
                  title="Unpin"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6l-12 12M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Scrollable Message List Section - Uses flex-1 to fill remaining space */}
      <section
        className="flex-1 relative z-10 min-h-0 overflow-hidden"
        onClick={(e) => {
          setShowMoreMenu(false);
          // If in selection mode and clicking on empty space in message list
          if (isSelectionMode && e.target === e.currentTarget) {
            setIsSelectionMode(false);
            setSelectedMessages(new Set());
          }
        }}
      >
        <MessageList
          messages={messages}
          userId={userId}
          activeContact={activeContact}
          myProfile={myProfile}
          API_BASE={API_BASE}
          scrollRef={scrollRef}
          onImageClick={onImageClick}
          wallpaperUrl={wallpaperUrl}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          selectedMessages={selectedMessages}
          setSelectedMessages={setSelectedMessages}
          isSelectionMode={isSelectionMode}
          setIsSelectionMode={setIsSelectionMode}
          pinnedMessages={pinnedMessages}
          setPinnedMessages={setPinnedMessages}
          onForward={handleForwardClick}
          onDeleteMessages={handleDeleteMessages}
          token={token}
        />
      </section>

      {/* 3. Fixed Input Section at Bottom */}
      <footer className="relative z-20 flex-shrink-0 bg-white border-t border-slate-200/60">
        <ChatInput
          text={text}
          onTextChange={onTextChange}
          send={send}
          recording={recording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          triggerMobileCapture={triggerMobileCapture}
          fileInputRef={fileInputRef}
          handleFileCapture={handleFileCapture}
          status={status}
          activeContact={activeContact}
          API_BASE={API_BASE}
          token={token}
          showUserDetails={showUserDetails}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          messages={messages}
          setMessages={setMessages}
        />
      </footer>

      <style>{`
        .chat-area-container {
          animation: slideIn 0.25s ease-out;
          overflow: hidden;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-slide-down {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        /* Custom Scrollbar for the message list */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.2);
        }
        
        /* Smooth scrolling on all browsers */
        .chat-area-container section {
          scroll-behavior: smooth;
        }
        
        /* Prevent bouncing effect on iOS */
        .chat-area-container {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          position: relative;
        }
        
        /* Prevent horizontal scroll on mobile */
        body {
          overflow-x: hidden;
        }
      `}</style>

      {/* Message Info Modal */}
      <MessageInfoModal
        visible={infoVisible}
        data={infoData}
        API_BASE={API_BASE}
        onClose={() => setInfoVisible(false)}
      />

      {/* Forward Modal */}
      <ForwardModal
        visible={forwardVisible}
        message={forwardingMessage}
        contacts={contacts}
        onForward={handleForwardMessage}
        onClose={() => setForwardVisible(false)}
        API_BASE={API_BASE}
        currentUserId={userId} // do not show self in list
      />

      <DeleteConfirmModal
        visible={deleteModal.visible}
        count={deleteModal.ids.length}
        allowEveryone={deleteModal.allowEveryone}
        onCancel={() => setDeleteModal({ visible: false, ids: [], allowEveryone: true })}
        onDeleteMe={() => confirmDelete(false)}
        onDeleteEveryone={() => confirmDelete(true)}
      />
    </div>
  );
}