import React, { useState, useEffect, useRef } from "react";
import AvatarImg from "../user/AvatarImg";
import MessageActionMenu from "./MessageActionMenu";
import MessageInfoModal from './MessageInfoModal';
import DeletedMessage from './DeletedMessage';

/* ================= STATUS INDICATOR ================= */
const StatusIndicator = ({ message, userId }) => {
  const isMe = String(message.sender?._id) === String(userId);
  if (!isMe) return null;

  const read = message.read ?? false;
  const delivered = message.delivered ?? false;

  if (read || delivered) {
    return (
      <div className="flex items-center justify-end -space-x-1">
        {[1, 2].map((i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${read ? "text-blue-500" : "text-gray-400"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        ))}
      </div>
    );
  }

  return (
    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
};

function isEmojiOnly(text) {
  const s = (text || '').trim();
  if (!s) return false;
  // remove whitespace and variation selectors
  const compact = s.replace(/\s+/g, '').replace(/\uFE0F/g, '');
  // Basic emoji-only heuristic: allow emoji presentation + ZWJ sequences.
  // This is intentionally simple and fast.
  return /^[\p{Extended_Pictographic}\u200D]+$/u.test(compact);
}
/* ================= MESSAGE LIST ================= */
export default function MessageList({
  messages,
  userId,
  activeContact,
  myProfile,
  API_BASE,
  scrollRef,
  onImageClick,
  wallpaperUrl,
  replyingTo,
  setReplyingTo,
  selectedMessages,
  setSelectedMessages,
  isSelectionMode,
  setIsSelectionMode,
  pinnedMessages,
  setPinnedMessages,
  onForward,
  onDeleteMessages, // new prop
  token,
  showUserDetails,
}) {
  // Allow activeContact to be either an object or a plain id string.
  if (!activeContact) return null;

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const longPressTimeoutRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isScrollingRef = useRef(false);
  const touchHandledRef = useRef(false);

  /* ===== Detect Mobile (Responsive Live) ===== */
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  /* ===== Auto-scroll when a replied-to message arrives ===== */
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last && last.replyTo && last.replyTo._id && scrollRef && scrollRef.current) {
      const el = document.querySelector(`[data-message-id="${last.replyTo._id}"]`);
      if (el) {
        // scroll container so that original message is visible
        scrollRef.current.scrollTop = el.offsetTop - 20;
      }
    }
  }, [messages, scrollRef]);

  // Robust touch start
  const handleTouchStart = (e, message) => {
    if (!isMobile) return;

    // Store exact start coordinates
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    isScrollingRef.current = false;
    touchHandledRef.current = false;

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    longPressTimeoutRef.current = setTimeout(() => {
      // If user moved their finger significantly, it's a scroll, abort long press
      if (isScrollingRef.current) return;

      touchHandledRef.current = true; // Mark as handled so onClick doesn't fire

      // Start selection mode
      if (!isSelectionMode) {
        setIsSelectionMode(true);
        if (navigator.vibrate) navigator.vibrate(50);
        // Open context menu alongside selection on first long press
        openMessageMenu({ preventDefault: () => { } }, message);
      }

      // Add message to selection (or toggle)
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(message._id)) {
          newSet.delete(message._id);
        } else {
          newSet.add(message._id);
          if (navigator.vibrate && isSelectionMode) navigator.vibrate(30);
        }
        return newSet;
      });
    }, 500); // 500ms WhatsApp-like long press
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    // Calculate distance moved
    const moveY = Math.abs(e.touches[0].clientY - touchStartY.current);
    const moveX = Math.abs(e.touches[0].clientX - touchStartX.current);

    // If moved more than 10px, it's a scroll gesture
    if (moveY > 10 || moveX > 10) {
      isScrollingRef.current = true;
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleMessageMouseUp = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  /* ===== Open Menu Handler ===== */
  const openMessageMenu = (e, message) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    // Don't show menu on mobile when in selection mode (unless it's the first long-press trigger)
    // We handle the trigger inside handleTouchStart's timeout
    if (isMobile && isSelectionMode && !setSelectedMessage) {
      return;
    }

    setSelectedMessage(message);

    if (isMobile) {
      // Mobile → Center / Bottom Menu
      setMenuAnchor({
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight - 260
      });
    } else {
      // Desktop → Cursor Position
      setMenuAnchor({
        x: e.clientX,
        y: e.clientY
      });
    }

    setMenuVisible(true);
  };

  /* ===== Close Menu ===== */
  const closeMenu = () => {
    setMenuVisible(false);
  };

  // Copy helper with fallback and brief feedback
  const [copiedText, setCopiedText] = useState(null);
  const handleCopy = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text || '');
      } else {
        const el = document.createElement('textarea');
        el.value = text || '';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      console.log('Copied to clipboard:', text);
      setCopiedText('Copied');
      setTimeout(() => setCopiedText(null), 1500);
    } catch (err) {
      console.error('Copy failed', err);
      setCopiedText('Copy failed');
      setTimeout(() => setCopiedText(null), 1500);
    }
    setMenuVisible(false);
  };

  const [infoVisible, setInfoVisible] = useState(false);
  const [infoData, setInfoData] = useState(null);

  const openInfo = (msg) => {
    setInfoData(msg);
    setInfoVisible(true);
  };

  /* ===== Filter Messages ===== */
  const contactId = activeContact && (typeof activeContact === 'object' ? String(activeContact._id || activeContact.id || '') : String(activeContact));

  const filtered = (messages || []).filter((m) => {
    if (activeContact?.isGroup && activeContact?.chatId) {
      return String(m.chat) === String(activeContact.chatId);
    }
    const me = String(userId);
    const other = contactId;
    const sId = m.sender?._id ? String(m.sender._id) : null;
    const rId = m.recipient?._id ? String(m.recipient._id) : null;

    return (sId === me && rId === other) || (sId === other && rId === me);
  });

  const ordered = filtered
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Log deleted messages in current conversation
  const deleted = ordered.filter(m => m.deletedForEveryone);
  if (deleted.length > 0) {
    console.log('[MessageList] Found', deleted.length, 'deleted messages:', deleted.map(m => ({ id: m._id, deleted: m.deletedForEveryone })));
  }

  // Auto-scroll behavior: scroll when user is near bottom OR when I send a message
  const lastMessageIdRef = useRef(null);
  useEffect(() => {
    if (!ordered || ordered.length === 0) return;
    const last = ordered[ordered.length - 1];
    if (!last || !scrollRef || !scrollRef.current) return;

    const el = scrollRef.current;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    const changed = String(last._id) !== String(lastMessageIdRef.current);
    const sentByMe = String(last.sender?._id) === String(userId);

    if (changed && (sentByMe || distanceFromBottom < 300)) {
      lastMessageIdRef.current = last._id;
      requestAnimationFrame(() => { try { el.scrollTop = el.scrollHeight; } catch (e) { } });
    } else if (changed) {
      lastMessageIdRef.current = last._id;
    }
  }, [ordered, userId, scrollRef]);

  // Scroll to bottom when activeContact changes (open conversation)
  useEffect(() => {
    if (!scrollRef || !scrollRef.current) return;
    requestAnimationFrame(() => { try { scrollRef.current.scrollTop = scrollRef.current.scrollHeight; } catch (e) { } });
  }, [activeContact]);

  const containerClass = showUserDetails ? 'max-w-sm mx-auto w-full' : 'max-w-5xl mx-auto w-full';

  return (
    <div
      ref={scrollRef}
      className="w-full h-full overflow-y-auto chat-scroll custom-scrollbar bg-white/5 backdrop-blur-sm pr-1 sm:pr-2"
      onClick={(e) => {
        if (e.target === e.currentTarget && isMobile && isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedMessages(new Set());
        }
      }}
      style={{
        backgroundImage: `url('${wallpaperUrl || 'https://www.transparenttextures.com/patterns/cubes.png'}')`,
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div className={`${containerClass} p-4 space-y-4 flex flex-col flex-grow justify-end`}>
        {ordered.map((m, index) => {
          if (m.deletedForEveryone) {
            return (
              <DeletedMessage key={m._id} viewerId={userId} senderId={m.sender?._id} />
            );
          }

          const isMe = String(m.sender?._id) === String(userId);
          const isLastTwo = index >= ordered.length - 2;

          const rawAvatar = isMe ? (myProfile?.avatar || "") : (m.sender?.avatar || activeContact?.avatar || "");
          const avatar = rawAvatar && rawAvatar.startsWith("/") ? `${API_BASE}${rawAvatar}` : rawAvatar;

          const bubbleClasses = [
            'relative max-w-[70%] px-4 py-2 rounded-xl shadow-sm transition-all select-none',
            isEmojiOnly(m.text) ? 'bg-transparent shadow-none !p-0 w-fit' : (isMe ? 'bg-orange-100/90 backdrop-blur-sm text-slate-800' : 'bg-white/70 backdrop-blur-sm text-slate-800'),
            (selectedMessages || new Set()).has(m._id) ? 'ring-2 ring-indigo-500 bg-indigo-100/50' : ''
          ].filter(Boolean).join(' ');

          return (
            <div key={m._id} className="flex items-end gap-2 group" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full overflow-hidden border shadow shrink-0">
                  <AvatarImg src={avatar} username={m.sender?.username || 'U'} size="w-full h-full" />
                </div>
              )}

              <div
                data-message-id={m._id}
                className={bubbleClasses}
                style={{ borderWidth: '2px', borderColor: 'transparent', backdropFilter: 'blur(4px)' }}
                onMouseDown={() => { if (!isMobile && isMobile) handleTouchStart({ touches: [{ clientX: 0, clientY: 0 }] }, m); }}
                onMouseUp={handleMessageMouseUp}
                onMouseLeave={handleMessageMouseUp}
                onTouchStart={(e) => handleTouchStart(e, m)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onContextMenu={(e) => { if (isMobile) e.preventDefault(); }}
                onClick={(e) => {
                  e.stopPropagation();

                  // Ghost click protection: if touch was handled by long press, don't trigger click
                  if (touchHandledRef.current) {
                    touchHandledRef.current = false; // Reset for next interactions
                    return;
                  }

                  if (isSelectionMode) {
                    setSelectedMessages(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(m._id)) {
                        newSet.delete(m._id);
                      } else {
                        newSet.add(m._id);
                        if (navigator.vibrate) navigator.vibrate(20); // multi-select haptics
                      }

                      // Auto-exit selection if empty
                      if (newSet.size === 0) setIsSelectionMode(false);
                      return newSet;
                    });
                  }
                }}
              >
                {!isMobile && (
                  <button className={`absolute top-1 right-2 p-1 rounded-full hover:bg-black/5 text-gray-500 opacity-0 group-hover:opacity-100`} onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const menuWidth = 200; const menuHeight = 240;
                    let x = isMe ? rect.left - menuWidth - 5 : rect.right + 5;
                    if (x < 10) x = rect.left + 15;
                    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 15;
                    let y = isLastTwo ? rect.top - menuHeight : rect.top;
                    if (!isLastTwo && rect.bottom + menuHeight > window.innerHeight) y = rect.bottom - menuHeight;
                    if (y < 10) y = 10;
                    setMenuAnchor({ x, y }); setSelectedMessage(m); setMenuVisible(true);
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                )}

                {m.replyTo && (
                  <div className="mb-1 p-2 rounded bg-gray-100 cursor-pointer" onClick={() => {
                    const el = document.querySelector(`[data-message-id="${m.replyTo._id}"]`);
                    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-indigo-500'); setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500'), 2000); }
                  }}>
                    <p className="text-[11px] font-semibold truncate text-gray-700">{m.replyTo.sender ? (String(m.replyTo.sender._id) === String(userId) ? 'You' : m.replyTo.sender.username || m.replyTo.sender.displayName || 'Unknown') : 'Unknown'}</p>
                    <p className="text-xs text-gray-800 truncate">{m.replyTo.text || (m.replyTo.image?.path ? '🖼️ Image' : m.replyTo.audio?.path ? '🎵 Voice' : 'Unknown message')}</p>
                  </div>
                )}

                {m.statusReply && (
                  <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center gap-2">
                    {m.statusReply?.media?.path ? (
                      <img src={`${API_BASE}${m.statusReply.media.path}`} alt="status preview" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-xs">TXT</div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-gray-700 block truncate">Replied to your status</span>
                      <span className="text-[11px] text-gray-500 truncate block">
                        {m.statusReply.type === 'video' ? '🎬 Video status' : m.statusReply.type === 'image' ? '📸 Image status' : (m.statusReply.text || 'Text status')}
                      </span>
                    </div>
                  </div>
                )}

                <div className={`space-y-2 select-none ${isEmojiOnly(m.text) ? '' : 'pr-4'}`}>
                  {m.text && (
                    <p className={isEmojiOnly(m.text) ? "text-5xl leading-tight m-0 p-0" : "text-sm whitespace-pre-wrap break-words"}>
                      {m.text}
                    </p>
                  )}
                  {m.image?.path && <img src={`${API_BASE}${m.image.path}`} className="max-h-64 rounded cursor-pointer" onClick={() => onImageClick?.(`${API_BASE}${m.image.path}`)} />}
                  {m.video?.path && (
                    <video
                      controls
                      playsInline
                      className="max-h-64 rounded w-full"
                      src={`${API_BASE}${m.video.path}`}
                    />
                  )}
                  {m.audio?.path && (
                    <div className="w-fit">
                      <audio controls className="w-[200px] sm:w-[260px] max-w-[75vw] h-10 align-middle" src={`${API_BASE}${m.audio.path}`} />
                    </div>
                  )}
                </div>

                <div className="text-[10px] mt-1 flex justify-end items-center gap-1 text-gray-400">
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <StatusIndicator message={m} userId={userId} />
                </div>
              </div>

              {isMe && (
                <div className="w-8 h-8 rounded-full overflow-hidden border shadow shrink-0">
                  <AvatarImg src={avatar} username={myProfile?.username || 'M'} size="w-full h-full" />
                </div>
              )}
            </div>
          );
        })}

        {/* ===== MENU ===== */}
        {selectedMessage && (
          <MessageActionMenu
            visible={menuVisible}
            anchor={menuAnchor}
            messageText={selectedMessage.text}
            onDelete={() => {
              if (onDeleteMessages && selectedMessage) {
                onDeleteMessages([selectedMessage._id]);
              }
              setMenuVisible(false);
            }}
            onReply={() => {
              setReplyingTo(selectedMessage);
              setMenuVisible(false);
            }}
            onForward={() => {
              if (onForward && selectedMessage) {
                // Pass message directly to avoid sync issues
                onForward(selectedMessage);
              }
              setMenuVisible(false);
            }}
            onPin={() => {
              const isPinned = pinnedMessages.some(m => m._id === selectedMessage._id);
              if (isPinned) {
                setPinnedMessages(prev => prev.filter(m => m._id !== selectedMessage._id));
              } else {
                setPinnedMessages(prev => [...prev, selectedMessage]);
              }
              setMenuVisible(false);
              console.log(isPinned ? 'Message unpinned' : 'Message pinned');
            }}
            onInfo={
              selectedMessage && String(selectedMessage.sender?._id) === String(userId)
                ? () => openInfo(selectedMessage)
                : undefined
            }
            onCopy={(text) => handleCopy(text)}
            onClose={() => setMenuVisible(false)}
          />
        )}
        {/* small toast feedback */}
        {copiedText && (
          <div style={{ position: 'fixed', bottom: 120, right: 20, background: '#111', color: 'white', padding: '8px 12px', borderRadius: 8, zIndex: 20000 }}>
            {copiedText}
          </div>
        )}

        <MessageInfoModal visible={infoVisible} data={infoData} onClose={() => setInfoVisible(false)} />
      </div>
    </div>
  );
}
