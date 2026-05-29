import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import session from '../session'
import Sidebar from '../components/sidebar/Sidebar'
import ChatMessagingArea from '../components/chat/ChatMessagingArea'
import ChatModals from '../components/modals/ChatModals'
import GroupForm from '../components/modals/GroupForm'
import AddContactPage from './AddContactPage'
import { useChatStatus } from '../hooks/useChatHooks'
import { resolveApiBase } from '../apiBase'

const API_BASE = resolveApiBase();

// Avatar image and subcomponents moved to separate files for clarity

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [recipient, setRecipient] = useState('')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [contacts, setContacts] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({});
  const [contactSearch, setContactSearch] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [activeContact, setActiveContact] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newIdentifier, setNewIdentifier] = useState('')
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [addMsg, setAddMsg] = useState('')
  const [showSidebar, setShowSidebar] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [myProfile, setMyProfile] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [viewingImageUrl, setViewingImageUrl] = useState(null)
  const [loadingUserDetails, setLoadingUserDetails] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set()) // Track which users are typing
  const [statusFeed, setStatusFeed] = useState([]) // Track users with statuses
  const [groups, setGroups] = useState([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupNameInput, setGroupNameInput] = useState('')
  const [groupMemberIds, setGroupMemberIds] = useState([])
  const [wallpaperUrl, setWallpaperUrl] = useState('')
  const [showWallpaperModal, setShowWallpaperModal] = useState(false)
  const [uploadingWallpaper, setUploadingWallpaper] = useState(false)
  const [showSaveContact, setShowSaveContact] = useState(false)
  const [contactToSave, setContactToSave] = useState(null)
  const [savedContactsMap, setSavedContactsMap] = useState({}) // Map: phoneNumber -> { customName, phoneNumber }
  const menuRef = useRef(null)
  const typingTimeoutRef = useRef(null) // Timeout for stopping typing indicator
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const fileInputRef = useRef(null);
  const audioChunksRef = useRef([])
  const navigate = useNavigate();
  // show main chat area: on desktop always visible; on mobile only when sidebar is closed
  const mainVisible = isDesktop || !showSidebar;

  const scrollRef = useRef(null);
  const [token, setToken] = useState(session.getToken());
  const [userId, setUserId] = useState(session.getUserId());
  const [initialized, setInitialized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = session.subscribe(() => {
      setToken(session.getToken());
      setUserId(session.getUserId());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!userId) {
      return;
    }
  }, [token, userId, navigate]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setInitialized(true);
      return;
    }
    if (userId) {
      setInitialized(true);
      return;
    }

    const restoreUserId = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          const restoredId = data?.user?._id || data?.user?.id;
          if (restoredId) {
            setUserId(restoredId);
            session.setUserId(restoredId);
          }
        }
      } catch (err) {
        console.warn('[ChatPage] Failed to restore userId from profile', err);
      } finally {
        if (active) setInitialized(true);
      }
    };

    restoreUserId();
    return () => { active = false; };
  }, [token, userId, API_BASE]);

  // Use custom hook for online status and profile management
  useChatStatus(token, userId, API_BASE, setMyProfile);

  // Detect URL location and show AddContactPage accordingly
  useEffect(() => {
    setShowAdd(location.pathname === '/add-contact');
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setShowCreateGroup(true);
    window.addEventListener('open-create-group', handler);
    return () => window.removeEventListener('open-create-group', handler);
  }, []);

  // Polling setup for typing indicators
  useEffect(() => {
    if (!token || !userId || !activeContact) return;

    const contactId = String(activeContact._id);

    // Poll (no websockets) to check if contact is typing
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/typing-status/${contactId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          return;
        }
        const data = await res.json();

        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, contactId]));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(contactId);
            return newSet;
          });
        }
      } catch (err) {
      }
    }, 700);

    return () => {
      clearInterval(pollInterval);
    };
  }, [token, userId, activeContact, API_BASE]);

  // Poll typing status for all contacts so sidebar can show typing indicators
  useEffect(() => {
    if (!token || !userId || !contacts || contacts.length === 0) return;

    let mounted = true;
    const checkAll = async () => {
      try {
        const updates = new Set();
        await Promise.all(contacts.map(async (c) => {
          try {
            if (!c || !c._id) return;
            const res = await fetch(`${API_BASE}/api/messages/typing-status/${c._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const d = await res.json();
            if (d.isTyping) updates.add(String(c._id));
          } catch (e) { }
        }));

        if (!mounted) return;
        // Replace typingUsers with the new set (keep as Set in state)
        setTypingUsers(prev => {
          const newSet = new Set();
          updates.forEach(id => newSet.add(id));
          return newSet;
        });
      } catch (err) { console.warn('[typing-all-poll error]', err); }
    };

    // initial check and interval
    checkAll();
    const iv = setInterval(checkAll, 1000);
    return () => { mounted = false; clearInterval(iv); };
  }, [token, userId, contacts]);


  // responsive desktop detection
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Open mobile sidebar automatically when there is no selected conversation
  useEffect(() => {
    if (!isDesktop && !activeContact && !showSidebar) {
      setShowSidebar(true);
    }
  }, [isDesktop, activeContact, showSidebar]);

  // Close menu when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!showMenu) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [showMenu]);

  // Prevent body scrolling when mobile sidebar is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showSidebar && !isDesktop) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    // ensure restored when sidebar closed
    document.body.style.overflow = '';
    return undefined;
  }, [showSidebar, isDesktop]);

  // Scroll to bottom functionality
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeContact]);

  // Audio recording helpers
  const startRecording = async () => {
    if (!activeContact) return setStatus('❌ Select a contact to send voice');

    setStatus('🎤 Accessing microphone...');
    console.log('[mic] Device:', navigator.userAgent.substring(0, 100));
    console.log('[mic] APIs available:', {
      mediaDevices: !!navigator?.mediaDevices,
      webkitGetUserMedia: !!navigator?.webkitGetUserMedia,
      mozGetUserMedia: !!navigator?.mozGetUserMedia,
      getUserMedia: !!navigator?.getUserMedia
    });

    try {
      let stream = null;
      let lastError = null;

      // Try 1: Modern mediaDevices API
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          console.log('[mic] Attempt 1: mediaDevices.getUserMedia()');
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('[mic] ✅ Got stream (modern API)');
        } catch (err) {
          console.warn('[mic] Attempt 1 failed:', err.name, err.message);
          lastError = err;
        }
      }

      // Try 2: mediaDevices with constraints
      if (!stream && navigator?.mediaDevices?.getUserMedia) {
        try {
          console.log('[mic] Attempt 2: mediaDevices with constraints');
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false }
          });
          console.log('[mic] ✅ Got stream (with constraints)');
        } catch (err) {
          console.warn('[mic] Attempt 2 failed:', err.name);
          lastError = err;
        }
      }

      // Try 3: Older webkit API
      if (!stream && navigator?.webkitGetUserMedia) {
        try {
          console.log('[mic] Attempt 3: navigator.webkitGetUserMedia()');
          stream = await new Promise((resolve, reject) => {
            navigator.webkitGetUserMedia({ audio: true }, resolve, reject);
          });
          console.log('[mic] ✅ Got stream (webkit)');
        } catch (err) {
          console.warn('[mic] Attempt 3 failed:', err.name);
          lastError = err;
        }
      }

      // Try 4: Older moz API
      if (!stream && navigator?.mozGetUserMedia) {
        try {
          console.log('[mic] Attempt 4: navigator.mozGetUserMedia()');
          stream = await new Promise((resolve, reject) => {
            navigator.mozGetUserMedia({ audio: true }, resolve, reject);
          });
          console.log('[mic] ✅ Got stream (moz)');
        } catch (err) {
          console.warn('[mic] Attempt 4 failed:', err.name);
          lastError = err;
        }
      }

      // Try 5: Direct navigator.getUserMedia (very old)
      if (!stream && navigator?.getUserMedia) {
        try {
          console.log('[mic] Attempt 5: navigator.getUserMedia()');
          stream = await new Promise((resolve, reject) => {
            navigator.getUserMedia({ audio: true }, resolve, reject);
          });
          console.log('[mic] ✅ Got stream (old API)');
        } catch (err) {
          console.warn('[mic] Attempt 5 failed:', err.name);
          lastError = err;
        }
      }

      // Try 6: enumerate and use device ID
      if (!stream && navigator?.mediaDevices?.enumerateDevices) {
        try {
          console.log('[mic] Attempt 6: enumerate devices');
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioDevices = devices.filter(d => d.kind === 'audioinput');
          console.log('[mic] Found', audioDevices.length, 'audio devices');

          if (audioDevices.length > 0) {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: audioDevices[0].deviceId }
            });
            console.log('[mic] ✅ Got stream using device ID');
          }
        } catch (err) {
          console.warn('[mic] Attempt 6 failed:', err.name);
          lastError = err;
        }
      }

      // Success - start recording
      if (stream) {
        console.log('[mic] Starting MediaRecorder');
        const mr = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mr.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            audioChunksRef.current.push(ev.data);
          }
        };

        mr.onstop = async () => {
          try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log('[mic] Blob size:', blob.size);
            setStatus('📤 Uploading voice...');
            await uploadVoice(blob);
          } catch (e) {
            console.error('[mic] Upload error:', e.message);
            setStatus('❌ Upload failed: ' + e.message);
          }
          try {
            stream.getTracks().forEach(t => t.stop());
          } catch (e) { }
        };

        mr.onerror = (event) => {
          console.error('[mic] Recording error:', event.error);
          setStatus('❌ Recording error: ' + event.error);
        };

        mediaRecorderRef.current = mr;
        mr.start();
        setRecording(true);
        setStatus('🎤 Recording... (tap to stop)');
        return;
      }

      // FAILURE - no stream available
      console.error('[mic] ❌ All 6 attempts failed');
      console.log('[mic] Last error:', lastError?.name, '-', lastError?.message);
      console.log('[mic] User Agent:', navigator.userAgent);

      let errorMsg = '';

      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        errorMsg = '🔒 MICROPHONE PERMISSION DENIED\n\n' +
          'Fix:\n' +
          '1. RELOAD page (Ctrl+R or F5)\n' +
          '2. When popup appears: Tap "Allow"\n' +
          '3. Try again\n\n' +
          'If still blocked:\n' +
          'Settings > Apps > ' +
          (navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser') +
          ' > Permissions\n' +
          'Enable: Microphone';
      } else if (lastError?.name === 'NotFoundError') {
        errorMsg = '❌ NO MICROPHONE DETECTED\n\n' +
          'Your device doesn\'t have a microphone or it\'s disabled.\n\n' +
          'Try:\n' +
          '1. Check if phone has microphone\n' +
          '2. Connect external microphone\n' +
          '3. Restart phone\n' +
          '4. Check hardware settings';
      } else if (lastError?.name === 'AbortError') {
        errorMsg = '❌ MICROPHONE IN USE\n\n' +
          'Another app is using the microphone.\n\n' +
          'Fix:\n' +
          '1. Close other apps (especially: Voice Call, Messenger, WhatsApp)\n' +
          '2. Close browser tabs playing audio\n' +
          '3. Restart browser\n' +
          '4. Try again';
      } else if (lastError?.name === 'NotSupportedError') {
        errorMsg = '❌ BROWSER DOESN\'T SUPPORT\n\n' +
          'Your browser can\'t access microphone.\n\n' +
          'Try:\n' +
          '1. Uninstall and reinstall browser\n' +
          '2. Try Chrome (recommended)\n' +
          '3. Try Firefox';
      } else if (!navigator?.mediaDevices && !navigator?.webkitGetUserMedia && !navigator?.mozGetUserMedia && !navigator?.getUserMedia) {
        errorMsg = '❌ MICROPHONE API NOT AVAILABLE\n\n' +
          'Possible reasons:\n' +
          '• Browser too old\n' +
          '• Private/Incognito mode enabled\n' +
          '• Running on old Android\n\n' +
          'Fix:\n' +
          '1. Exit private/incognito mode\n' +
          '2. Update browser to latest version\n' +
          '3. Try Chrome or Firefox\n' +
          '4. On Android: Check if browser has mic permission in Settings';
      } else {
        errorMsg = '⚠️ UNKNOWN ERROR\n\n' +
          'Error type: ' + (lastError?.name || 'Unknown') + '\n' +
          'Message: ' + (lastError?.message || 'No details') + '\n\n' +
          'Try:\n' +
          '1. Reload page (F5)\n' +
          '2. Restart browser\n' +
          '3. Restart phone\n' +
          '4. Check console for details';
      }

      setStatus(errorMsg);

    } catch (e) {
      console.error('[mic] Exception:', e.message);
      setStatus('❌ UNEXPECTED ERROR\n\n' + e.message + '\n\nReload page and try again');
    }
  };

  const triggerMobileCapture = () => {
    try {
      if (fileInputRef.current) fileInputRef.current.click();
    } catch (e) { console.warn('[triggerMobileCapture]', e); }
  };

  const handleFileCapture = async (e) => {
    try {
      const f = e?.target?.files?.[0];
      if (!f) return;
      console.log('[handleFileCapture] got file', f.type, f.size);
      await uploadVoice(f);
    } catch (err) {
      console.error('[handleFileCapture error]', err);
    } finally {
      try { e.target.value = ''; } catch (e) { }
    }
  };

  // Recording only starts on explicit button click - removed auto-start to prevent unwanted recording

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    } catch (e) { console.warn('[stopRecording]', e); }
    setRecording(false);
  };

  const uploadVoice = async (blob) => {
    if (!token || !activeContact) return;
    try {
      console.log('[uploadVoice] uploading voice for recipient:', activeContact._id, 'sizeBytes:', blob.size);
      const fd = new FormData();
      // Ensure filename extension matches the blob type for better backend mimetype handling.
      const t = (blob && blob.type) ? String(blob.type) : '';
      const ext =
        t.includes('mpeg') || t.includes('mp3') ? 'mp3' :
          t.includes('wav') ? 'wav' :
            t.includes('ogg') ? 'ogg' :
              'webm';
      fd.append('voice', blob, `voice-${Date.now()}.${ext}`);
      fd.append('recipientId', activeContact._id);

      const res = await fetch(`${API_BASE}/api/messages/send-voice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      console.log('[uploadVoice] response status:', res.status, 'statusText:', res.statusText);

      if (res.ok) {
        const d = await res.json();
        console.log('[uploadVoice] success, message:', JSON.stringify(d.message).slice(0, 300));

        // Ensure message has proper structure before adding to state
        if (d.message) {
          console.log('[uploadVoice] Adding message to state. Audio field:', d.message.audio ? 'YES' : 'NO');
          setMessages(prev => {
            const updated = [d.message, ...prev];
            console.log('[uploadVoice] New message count:', updated.length);
            return updated;
          });
          setStatus('✅ Voice message sent!');
          setTimeout(() => setStatus(''), 3000);
        } else {
          console.error('[uploadVoice] No message in response');
          setStatus('❌ No message in response');
        }
      } else {
        const text = await res.text().catch(() => '');
        console.error('[uploadVoice] failed', res.status, text);
        setStatus(`❌ Upload failed: ${res.status} - ${text}`);
      }
    } catch (e) {
      console.error('[uploadVoice error]', e.message);
      setStatus('❌ ' + e.message);
    }
  };

  const mergeContactsFromMessages = (msgs, myId, existingContacts) => {
    const map = {};

    // First, add all existing (saved) contacts to the map - these have the most recent lastLogout
    existingContacts.forEach(c => {
      if (c?._id) {
        map[String(c._id)] = {
          _id: c._id,
          displayName: c.displayName || c.phone || 'Unknown',
          username: c.username || '',
          phone: c.phone || '',
          email: c.email || '',
          about: c.about || '',
          avatar: c.avatar ? (c.avatar.startsWith('/') ? `${API_BASE}${c.avatar}` : c.avatar) : '',
          lastLogout: c.lastLogout || null
        };
      }
    });

    // Then, enhance with message data (but don't override lastLogout from saved contacts)
    msgs.forEach(m => {
      try {
        const sId = m.sender?._id ? String(m.sender._id) : null;
        const rId = m.recipient?._id ? String(m.recipient._id) : null;
        const myIdStr = String(myId);
        let other = (sId === myIdStr) ? m.recipient : (rId === myIdStr ? m.sender : null);

        if (other?._id) {
          const otherId = String(other._id);
          const newData = {
            _id: other._id,
            displayName: other.phone || 'Unknown',
            username: other.username || '',
            phone: other.phone || '',
            email: other.email || '',
            about: other.about || '',
            avatar: other.avatar ? (other.avatar.startsWith('/') ? `${API_BASE}${other.avatar}` : other.avatar) : '',
            lastLogout: other.lastLogout || null
          };
          // If contact exists, preserve its displayName and lastLogout from saved contacts
          if (map[otherId]) {
            map[otherId] = { ...newData, displayName: map[otherId].displayName, lastLogout: map[otherId].lastLogout || newData.lastLogout };
          } else {
            map[otherId] = newData;
          }
        }
      } catch (e) { }
    });
    return Object.values(map);
  };

  const mapGroupsToContacts = (groupsData = []) => {
    return (groupsData || []).map(g => ({
      _id: `group-${g._id}`,
      chatId: g._id,
      isGroup: true,
      displayName: g.title || g.metadata?.groupName || 'Unnamed Group',
      username: '',
      phone: '',
      email: '',
      avatar: g.avatar ? (g.avatar.startsWith('/') ? `${API_BASE}${g.avatar}` : g.avatar) : '',
      participants: g.participants || [],
      createdBy: g.metadata?.createdBy || null,
      lastActivityAt: g.lastActivityAt
    }));
  };

  const getDisplayForUser = (u) => {
    if (!u) return '';
    const direct = contacts.find(c => !c.isGroup && String(c._id) === String(u._id || u));
    // Prefer saved custom name from savedContactsMap
    const phone = (u && (u.phone || u.username)) || (direct && direct.phone) || '';
    if (phone && savedContactsMap[phone] && savedContactsMap[phone].customName) return savedContactsMap[phone].customName;
    if (direct?.displayName) return direct.displayName;
    return u.phone || direct?.phone || u.username || '';
  };

  const groupSubtitle = useMemo(() => {
    if (!activeContact?.isGroup) return '';
    const members = (activeContact.participants || [])
      .filter(p => String(p?._id || p) !== String(userId))
      .slice(0, 3)
      .map(p => getSavedContactName ? getSavedContactName({ phone: p?.phone, displayName: p?.username || p?.displayName, username: p?.username }) : getDisplayForUser(p))
      .filter(Boolean);
    return members.join(', ');
  }, [activeContact, contacts, userId]);

  const checkOnlineStatus = async (contactsList) => {
    if (!token || contactsList.length === 0) return;
    try {
      const directContacts = contactsList.filter(c => !c.isGroup);
      if (directContacts.length === 0) return;
      const userIds = directContacts.map(c => c._id).join(',');
      const res = await fetch(`${API_BASE}/api/users/online-status?userIds=${userIds}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        console.debug('[checkOnlineStatus] response:', d);
        const onlineSet = new Set(d.online || []);
        setOnlineUsers(onlineSet);

        // Update contacts with latest lastLogout data
        setContacts(prev => {
          return prev.map(contact => {
            const userData = d.users?.[String(contact._id)];
            if (userData && userData.lastLogout !== undefined) {
              return { ...contact, lastLogout: userData.lastLogout };
            }
            return contact;
          });
        });

        // Also update activeContact if it exists
        setActiveContact(prev => {
          if (!prev) return prev;
          const userData = d.users?.[String(prev._id)];
          if (userData && userData.lastLogout !== undefined) {
            return { ...prev, lastLogout: userData.lastLogout };
          }
          return prev;
        });
      } else {
        console.warn('[checkOnlineStatus] non-ok response', res.status);
      }
    } catch (err) {
      console.error('[checkOnlineStatus] error', err);
    }
  };

  const isContactOnline = (contactId) => {
    return onlineUsers.has(String(contactId));
  };

  const formatContactStatus = (contactId, lastLogout) => {
    if (isContactOnline(contactId)) return 'Online now';
    if (!lastLogout) return 'Last online: Unknown';

    // Accept Date, number (ms), or ISO string
    let date;
    if (lastLogout instanceof Date) date = lastLogout;
    else if (typeof lastLogout === 'number') date = new Date(lastLogout);
    else date = new Date(String(lastLogout));

    if (isNaN(date.getTime())) {
      console.warn('formatContactStatus: invalid lastLogout for', contactId, lastLogout);
      return 'Last online: Unknown';
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) return `Last online: Today at ${timeStr}`;
    if (isYesterday) return `Last online: Yesterday at ${timeStr}`;

    // Check if within last 7 days
    const timeDiff = today.getTime() - date.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff >= 0 && daysDiff <= 7) {
      // Show day name (Monday, Tuesday, etc.)
      const dayName = date.toLocaleDateString([], { weekday: 'long' });
      return `Last online: ${dayName} at ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `Last online: ${dateStr} at ${timeStr}`;
  };

  // Get the last message with a specific contact
  const getLastMessageForContact = (contactId) => {
    const selected = contacts.find(c => String(c._id) === String(contactId));
    if (selected?.isGroup && selected?.chatId) {
      const groupMessages = messages.filter(m => String(m.chat) === String(selected.chatId));
      if (groupMessages.length === 0) return null;
      return groupMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }

    const contactMessages = messages.filter(m =>
      (String(m.sender?._id) === String(contactId) && String(m.recipient?._id) === String(userId)) ||
      (String(m.recipient?._id) === String(contactId) && String(m.sender?._id) === String(userId))
    );

    if (contactMessages.length === 0) return null;

    // Return the most recent message
    return contactMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const formatLastMessage = (msg) => {
    if (!msg) return 'No messages yet';
    const isOwn = String(msg.sender?._id) === String(userId);
    const prefix = isOwn ? 'You: ' : '';

    // Check if it's an image message
    if (msg.image && msg.image.path) {
      return prefix + '🖼️ Image';
    }

    // Check if it's an audio message
    if (msg.audio && msg.audio.path) {
      return prefix + '🎵 Voice message';
    }

    const text = (msg.text || '').substring(0, 30);
    return prefix + text + (msg.text && msg.text.length > 30 ? '...' : '');
  };

  const formatDuration = (sec) => {
    if (!sec && sec !== 0) return '';
    const s = Math.round(Number(sec) || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r}s`;
  };

  const formatLastMessageTime = (msg) => {
    if (!msg || !msg.createdAt) return '';
    const t = new Date(msg.createdAt).getTime();
    const now = Date.now();
    const diff = now - t;
    const oneDay = 24 * 60 * 60 * 1000;
    const date = new Date(t);
    if (diff < oneDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getContactStatusWithDateTime = (contact) => {
    if (isContactOnline(contact._id)) {
      return 'Online now';
    }

    if (!contact.lastLogout) return 'Last online: Unknown';

    let date;
    if (contact.lastLogout instanceof Date) date = contact.lastLogout;
    else if (typeof contact.lastLogout === 'number') date = new Date(contact.lastLogout);
    else date = new Date(String(contact.lastLogout));

    if (isNaN(date.getTime())) {
      return 'Last online: Unknown';
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) return `Last online: Today at ${timeStr}`;
    if (isYesterday) return `Last online: Yesterday at ${timeStr}`;

    // Check if within last 7 days
    const timeDiff = today.getTime() - date.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff >= 0 && daysDiff <= 7) {
      // Show day name (Monday, Tuesday, etc.)
      const dayName = date.toLocaleDateString([], { weekday: 'long' });
      return `Last online: ${dayName} at ${timeStr}`;
    }

    // For older dates, also show day name with date
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `Last online: ${dateStr} at ${timeStr}`;
  };

  useEffect(() => {
    if (!token) return;

    // Fetch messages, saved contacts, and status feed
    Promise.all([
      fetch(`${API_BASE}/api/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/api/users/contacts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/api/status/feed`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/api/messages/groups`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
      .then(([messagesData, contactsData, statusData, groupsData]) => {
        const messages = messagesData.messages || [];
        const savedContacts = contactsData.contacts || [];
        const statuses = statusData.statuses || [];
        const groupsList = groupsData.groups || [];

        console.log('Loaded saved contacts:', savedContacts);
        console.log('Loaded status feed:', statuses);
        setMessages(messages);
        setStatusFeed(statuses);
        setGroups(groupsList);

        // Compute unread counts from messages where I'm the recipient and not read
        const counts = {};
        messages.forEach(m => {
          try {
            const isToMe = String(m.recipient?._id) === String(userId);
            if (isToMe && !m.read) {
              const sid = String(m.sender?._id || '');
              if (!sid) return;
              counts[sid] = (counts[sid] || 0) + 1;
            }
          } catch (e) { }
        });
        setUnreadCounts(counts);

        // Merge saved contacts with contacts from messages, then sort by recent message time
        const extractedContacts = mergeContactsFromMessages(messages, userId, savedContacts);
        const lastTimes = {};
        messages.forEach(m => {
          const time = new Date(m.createdAt).getTime();
          const sId = m.sender?._id ? String(m.sender._id) : null;
          const rId = m.recipient?._id ? String(m.recipient._id) : null;
          if (sId && sId !== String(userId)) lastTimes[sId] = Math.max(lastTimes[sId] || 0, time);
          if (rId && rId !== String(userId)) lastTimes[rId] = Math.max(lastTimes[rId] || 0, time);
        });
        const sortedDirect = extractedContacts.slice().sort((a, b) => (lastTimes[String(b._id)] || 0) - (lastTimes[String(a._id)] || 0));
        const groupContacts = mapGroupsToContacts(groupsList);
        const sorted = [...groupContacts, ...sortedDirect];
        console.log('Merged contacts:', sorted);
        setContacts(sorted);
        checkOnlineStatus(sorted);

        // If no active contact selected, auto-select the first conversation and set recipient
        setActiveContact(prev => {
          if (prev) return prev;
          const first = extractedContacts.length ? extractedContacts[0] : null;
          if (first) setRecipient(first.phone || first.username || '');
          return first;
        });
      })
      .catch((err) => {
        console.error('Failed to load contacts/messages:', err);
      });
  }, [token])

  // Load saved personal contacts
  useEffect(() => {
    if (!token) return;
    loadSavedContacts();
  }, [token])

  // Poll messages every 3 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const [messagesRes, contactsRes, groupsRes] = await Promise.all([
          fetch(`${API_BASE}/api/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/users/contacts`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/messages/groups`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (messagesRes.ok && contactsRes.ok) {
          const messagesData = await messagesRes.json();
          const contactsData = await contactsRes.json();
          const groupsData = groupsRes.ok ? await groupsRes.json() : { groups: [] };

          if (messagesData.messages) {
            const msgs = messagesData.messages;
            setMessages(msgs);

            // recompute unread counts
            const counts = {};
            msgs.forEach(m => {
              try {
                if (String(m.recipient?._id) === String(userId) && !m.read) {
                  const sid = String(m.sender?._id || '');
                  counts[sid] = (counts[sid] || 0) + 1;
                }
              } catch (e) { }
            });
            setUnreadCounts(counts);

            const savedContacts = contactsData.contacts || [];
            const updated = mergeContactsFromMessages(msgs, userId, savedContacts);
            const groupContacts = mapGroupsToContacts(groupsData.groups || []);
            // sort by last message time
            const lastTimes = {};
            msgs.forEach(m => {
              const time = new Date(m.createdAt).getTime();
              const sId = m.sender?._id ? String(m.sender._id) : null;
              const rId = m.recipient?._id ? String(m.recipient._id) : null;
              if (sId && sId !== String(userId)) lastTimes[sId] = Math.max(lastTimes[sId] || 0, time);
              if (rId && rId !== String(userId)) lastTimes[rId] = Math.max(lastTimes[rId] || 0, time);
            });
            const sortedDirect = updated.slice().sort((a, b) => (lastTimes[String(b._id)] || 0) - (lastTimes[String(a._id)] || 0));
            const sorted = [...groupContacts, ...sortedDirect];
            setContacts(sorted);
            setGroups(groupsData.groups || []);
            checkOnlineStatus(sorted);
            // ensure an active contact is selected if none and set recipient
            setActiveContact(prev => {
              if (prev) return prev;
              const first = updated.length ? updated[0] : null;
              if (first) setRecipient(first.phone || first.username || '');
              return first;
            });
          }
        }
      } catch (err) { }
    }, 3000);
    return () => clearInterval(interval);
  }, [token, userId]);

  // Load wallpaper per conversation
  useEffect(() => {
    let mounted = true;
    if (!token || !activeContact?._id) return;
    (async () => {
      try {
        const wallpaperKey = activeContact.isGroup ? `group-${activeContact.chatId}` : activeContact._id;
        const res = await fetch(`${API_BASE}/api/messages/wallpaper/${wallpaperKey}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const d = await res.json();
        if (!mounted) return;
        setWallpaperUrl(d.wallpaper || '');
      } catch (e) { }
    })();
    return () => { mounted = false; };
  }, [token, activeContact?._id, API_BASE]);

  const saveWallpaper = async (nextUrl) => {
    if (!token || !activeContact?._id) return;
    try {
      const body = activeContact.isGroup
        ? { chatId: activeContact.chatId, wallpaper: nextUrl }
        : { recipientId: activeContact._id, wallpaper: nextUrl };
      const res = await fetch(`${API_BASE}/api/messages/wallpaper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Failed');
      setWallpaperUrl(d.wallpaper || nextUrl || '');
    } catch (e) {
      alert('❌ Failed to save wallpaper');
    }
  };

  const uploadWallpaperFile = async (file) => {
    if (!token || !activeContact?._id || !file) return;
    setUploadingWallpaper(true);
    try {
      const fd = new FormData();
      if (activeContact.isGroup) fd.append('chatId', activeContact.chatId);
      else fd.append('recipientId', activeContact._id);
      fd.append('wallpaper', file);
      const res = await fetch(`${API_BASE}/api/messages/wallpaper-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Failed to upload wallpaper');
      setWallpaperUrl(d.wallpaper || '');
      setShowWallpaperModal(false);
    } catch (e) {
      alert('❌ Failed to upload wallpaper');
    } finally {
      setUploadingWallpaper(false);
    }
  };

  const logout = () => {
    // Mark as offline before logout
    fetch(`${API_BASE}/api/users/offline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true
    }).catch(() => { });

    session.removeToken();
    session.setUserId(null);
    window.location.href = '/login';
  };

  const send = async () => {
    if (!text.trim()) return;
    if (!activeContact?.isGroup && !recipient) return;
    try {
      const isGroup = !!activeContact?.isGroup;
      const url = isGroup ? `${API_BASE}/api/messages/send-group` : `${API_BASE}/api/messages/send`;
      const payload = isGroup
        ? { groupId: activeContact.chatId, text }
        : { identifier: recipient, text };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setText('');
        setStatus('');
        // Refresh messages immediately after send
        const res2 = await fetch(`${API_BASE}/api/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } });
        if (res2.ok) {
          const d = await res2.json();
          if (d.messages) {
            setMessages(d.messages);
            setContacts(prev => {
              const updatedDirect = mergeContactsFromMessages(d.messages, userId, prev.filter(c => !c.isGroup));
              const merged = [...prev.filter(c => c.isGroup), ...updatedDirect];
              checkOnlineStatus(merged.filter(c => !c.isGroup));
              return merged;
            });
            // Scroll to bottom after sender's message is added
            setTimeout(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }, 0);
          }
        }
      } else {
        const err = await res.json();
        const errorMsg = err.error || 'Failed to send message';
        console.error('Send failed:', errorMsg, 'Status:', res.status, 'Recipient:', recipient);
        setStatus(errorMsg);
      }
    } catch (err) {
      const msg = err.message || String(err);
      console.error('[ChatPage] Send error:', msg, 'Recipient:', recipient, 'Text:', text.slice(0, 20));
      setStatus('Error: ' + msg);
    }
  }

  const selectContact = (c) => {
    setActiveContact(c);
    setRecipient(c.isGroup ? c.chatId : (c.phone || c.username));
    setShowSidebar(false);
    // Mark conversation as read on backend and clear unread count locally
    if (token && c && c._id && !c.isGroup) {
      fetch(`${API_BASE}/api/messages/read-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactId: c._id })
      }).then(() => {
        setUnreadCounts(prev => {
          const copy = { ...prev };
          delete copy[String(c._id)];
          return copy;
        });
      }).catch(() => { });
    }
  }

  const addContact = async () => {
    if (!newIdentifier) return setAddMsg('Provide phone or username');
    try {
      const res = await fetch(`${API_BASE}/api/users/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ identifier: newIdentifier, displayName: displayNameInput })
      });
      const d = await res.json();
      if (!res.ok) return setAddMsg(d.error || 'Failed to add');
      const added = {
        _id: d.user._id,
        displayName: d.displayName || d.user.username,
        username: d.user.username,
        phone: d.user.phone,
        email: d.user.email,
        avatar: d.user.avatar ? (d.user.avatar.startsWith('/') ? `${API_BASE}${d.user.avatar}` : d.user.avatar) : '',
        lastLogout: d.user.lastLogout || null
      };
      setContacts(c => [added, ...c.filter(x => String(x._id) !== String(added._id))]);
      setShowAdd(false);
      setNewIdentifier('');
      setDisplayNameInput('');
      setAddMsg('');
    } catch (err) {
      setAddMsg('Network error');
      console.error('Add contact error:', err);
    }
  }

  // Load saved personal contacts from the contacts collection
  const loadSavedContacts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const map = {};
        (data.contacts || []).forEach(c => {
          map[c.phoneNumber] = {
            customName: c.customName,
            phoneNumber: c.phoneNumber,
            _id: c._id
          };
        });
        setSavedContactsMap(map);
        console.log('[SaveContact] Loaded saved contacts map:', map);
      }
    } catch (err) {
      console.error('[SaveContact] Error loading saved contacts:', err);
    }
  };

  // Check if a contact is already saved
  const isSavedContact = (contact) => {
    if (!contact || contact.isGroup) return false;
    const phone = contact.phone || contact.username;
    return phone && savedContactsMap[phone] ? true : false;
  };

  // Get saved contact name, fallback to original name
  const getSavedContactName = (contact) => {
    if (!contact) return 'Unknown';
    if (contact.isGroup) return contact.displayName || 'Group';

    const phone = contact.phone || contact.username;
    const savedContact = phone ? savedContactsMap[phone] : null;

    // Return saved custom name if exists, otherwise use original displayName/username
    if (savedContact && savedContact.customName) {
      return savedContact.customName;
    }
    return contact.displayName || contact.username || 'Unknown';
  };

  // Open the save contact modal
  const handleSaveContact = () => {
    if (activeContact && !activeContact.isGroup) {
      setContactToSave(activeContact);
      setShowSaveContact(true);
    }
  };

  // Handle successful contact save
  const handleSaveContactSuccess = (savedContact) => {
    console.log('[SaveContact] Contact saved:', savedContact);
    // Add the contact to savedContactsMap
    if (savedContact.phoneNumber) {
      setSavedContactsMap(prev => ({
        ...prev,
        [savedContact.phoneNumber]: {
          customName: savedContact.customName,
          phoneNumber: savedContact.phoneNumber,
          _id: savedContact._id
        }
      }));
    }
    // Close modal (already done by modal, but ensure state is clean)
    setShowSaveContact(false);
  };

  const createGroup = async (avatarPath = '') => {
    if (!groupNameInput.trim() || groupMemberIds.length === 0) return;
    try {
      const payload = { name: groupNameInput.trim(), memberIds: groupMemberIds };
      if (avatarPath) payload.avatar = avatarPath;
      const res = await fetch(`${API_BASE}/api/messages/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Failed to create group');
      setShowCreateGroup(false);
      setGroupNameInput('');
      setGroupMemberIds([]);
      const g = d.group;
      const groupContact = {
        _id: `group-${g._id}`,
        chatId: g._id,
        isGroup: true,
        displayName: g.title || g.metadata?.groupName || 'Unnamed Group',
        avatar: g.avatar ? (g.avatar.startsWith('/') ? `${API_BASE}${g.avatar}` : g.avatar) : ''
      };
      setGroups(prev => [g, ...prev]);
      setContacts(prev => [groupContact, ...prev]);
      selectContact(groupContact);
    } catch (err) {
      alert('❌ ' + (err.message || 'Failed to create group'));
    }
  };

  const handleOpenUserDetails = async (contact) => {
    if (contact?.isGroup) {
      const members = (contact.participants || []).map(p => {
        const id = String(p?._id || p);
        const label = getSavedContactName ? getSavedContactName({ phone: p?.phone, displayName: p?.username || p?.displayName, username: p?.username }) : getDisplayForUser(p);
        const isAdmin = String(contact.createdBy || '') === id;
        return { id, label: isAdmin ? `${label || id} (Admin)` : (label || id), phone: p?.phone || '' };
      });
      setSelectedUserForDetails({
        _id: contact.chatId,
        displayName: contact.displayName,
        username: contact.displayName,
        phone: '',
        email: '',
        about: `Group chat with ${contact.participants?.length || 0} members`,
        avatar: contact.avatar || '',
        isGroup: true,
        groupMembers: members,
      });
      setShowUserDetails(true);
      setLoadingUserDetails(false);
      if (!isDesktop) setShowSidebar(false);
      return;
    }

    setShowUserDetails(true);
    setLoadingUserDetails(true);

    try {
      // Fetch fresh user data from backend to get latest about, avatar, etc.
      const res = await fetch(`${API_BASE}/api/users/user-details/${contact._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Merge with existing contact data (displayName, etc)
        const enrichedUser = {
          ...data.user,
          displayName: contact.displayName || data.user.displayName || data.user.username
        };
        // fetch any owner-specific override and merge
        try {
          const ov = await fetch(`${API_BASE}/api/users/contacts/override/${contact._id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (ov.ok) {
            const od = await ov.json();
            if (od.override) {
              if (od.override.displayName) enrichedUser.displayName = od.override.displayName;
              if (od.override.phone) enrichedUser.phone = od.override.phone;
            }
          }
        } catch (e) { /* ignore override errors */ }
        setSelectedUserForDetails(enrichedUser);
      } else {
        // Fallback to contact data if fetch fails
        setSelectedUserForDetails(contact);
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      // Fallback to contact data if fetch fails
      setSelectedUserForDetails(contact);
    } finally {
      setLoadingUserDetails(false);
    }

    // Close main sidebar on mobile when opening user details
    if (!isDesktop) {
      setShowSidebar(false);
    }
  };

  const handleViewPhoto = (imageUrl) => {
    setViewingImageUrl(imageUrl);
    setShowImageViewer(true);
  };

  const handleCloseUserDetails = (keepSelected = false) => {
    setShowUserDetails(false);
    if (!keepSelected) setTimeout(() => setSelectedUserForDetails(null), 300);
  };

  const handleCloseImageViewer = () => {
    setShowImageViewer(false);
    setTimeout(() => setViewingImageUrl(null), 300);
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5] text-slate-700 text-lg font-medium">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#f0f2f5] font-sans antialiased overflow-hidden text-slate-800 grid md:grid-cols-[auto_1fr_auto]">

      {/* ADD CONTACT PAGE - Full page overlay */}
      {showAdd && (
        <AddContactPage
          onClose={() => setShowAdd(false)}
          onAddContact={addContact}
          apiBase={API_BASE}
          token={token}
          userId={userId}
          navigate={navigate}
        />
      )}

      {/* MAIN LAYOUT - Hidden when showing AddContactPage */}
      {!showAdd && (
        <>
          {/* SIDEBAR COMPONENT */}
          <Sidebar
            myProfile={myProfile}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            menuRef={menuRef}
            showSidebar={showSidebar}
            navigate={navigate}
            setShowAdd={setShowAdd}
            logout={logout}
            contactSearch={contactSearch}
            setContactSearch={setContactSearch}
            contacts={contacts}
            activeContact={activeContact}
            selectContact={selectContact}
            isContactOnline={isContactOnline}
            formatContactStatus={formatContactStatus}
            getLastMessageForContact={getLastMessageForContact}
            formatLastMessage={formatLastMessage}
            formatLastMessageTime={formatLastMessageTime}
            formatDuration={formatDuration}
            unreadCounts={unreadCounts}
            typingUsers={typingUsers}
            userId={userId}
            API_BASE={API_BASE}
            statusFeed={statusFeed}
            token={token}
            setContacts={setContacts}
            getSavedContactName={getSavedContactName}
          />

          {/* MAIN CHAT AREA */}
          {mainVisible && (
            <ChatMessagingArea
              activeContact={activeContact}
              myProfile={myProfile}
              isContactOnline={isContactOnline}
              typingUsers={typingUsers}
              setShowSidebar={setShowSidebar}
              handleOpenUserDetails={handleOpenUserDetails}
              getContactStatusWithDateTime={getContactStatusWithDateTime}
              messages={messages}
              setMessages={setMessages}
              userId={userId}
              scrollRef={scrollRef}
              API_BASE={API_BASE}
              wallpaperUrl={wallpaperUrl}
              onChangeWallpaper={() => setShowWallpaperModal(true)}
              groupSubtitle={groupSubtitle}
              text={text}
              onTextChange={(e) => {
                setText(e.target.value);
                if (activeContact && token && !activeContact.isGroup) {
                  fetch(`${API_BASE}/api/messages/typing`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ recipientId: activeContact._id })
                  }).catch(() => { });
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    fetch(`${API_BASE}/api/messages/stop-typing`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ recipientId: activeContact._id })
                    }).catch(() => { });
                  }, 1000);
                }
              }}
              send={send}
              recording={recording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              triggerMobileCapture={triggerMobileCapture}
              fileInputRef={fileInputRef}
              handleFileCapture={handleFileCapture}
              status={status}
              token={token}
              onImageClick={handleViewPhoto}
              showUserDetails={showUserDetails}
              onSaveContact={handleSaveContact}
              isSavedContact={isSavedContact(activeContact)}
              getSavedContactName={getSavedContactName}
            />
          )}

          {/* Wallpaper Picker */}
          {showWallpaperModal && activeContact && (
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowWallpaperModal(false)}>
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-bold text-slate-800">Chat Wallpaper</div>
                  <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setShowWallpaperModal(false)}>✕</button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose wallpaper</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Default', url: 'https://www.transparenttextures.com/patterns/cubes.png' },
                      { label: 'Graphy', url: 'https://www.transparenttextures.com/patterns/graphy.png' },
                      { label: 'Diagonal', url: 'https://www.transparenttextures.com/patterns/diagonal-noise.png' },
                      { label: 'Hexellence', url: 'https://www.transparenttextures.com/patterns/hexellence.png' },
                      { label: 'Asfalt', url: 'https://www.transparenttextures.com/patterns/asfalt-light.png' },
                      { label: 'Food', url: 'https://www.transparenttextures.com/patterns/food.png' },
                    ].map(p => (
                      <button
                        key={p.url}
                        className="rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-300 transition"
                        onClick={() => { saveWallpaper(p.url); setShowWallpaperModal(false); }}
                      >
                        <div className="h-20 w-full" style={{ backgroundImage: `url('${p.url}')` }} />
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-700">{p.label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload custom wallpaper</div>
                    <label className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer">
                      {uploadingWallpaper ? 'Uploading...' : 'Choose image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingWallpaper}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadWallpaperFile(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {[
                    { label: 'Reset to default', url: 'https://www.transparenttextures.com/patterns/cubes.png' },
                  ].map(p => (
                    <button
                      key={p.url}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50"
                      onClick={() => { saveWallpaper(p.url); setShowWallpaperModal(false); }}
                    >
                      <span className="text-sm font-semibold text-slate-700">{p.label}</span>
                      <span className="text-xs text-slate-400 truncate max-w-40">Apply</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Create Group Modal (moved to GroupForm component) */}
          <GroupForm
            showCreateGroup={showCreateGroup}
            setShowCreateGroup={setShowCreateGroup}
            groupNameInput={groupNameInput}
            setGroupNameInput={setGroupNameInput}
            groupMemberIds={groupMemberIds}
            setGroupMemberIds={setGroupMemberIds}
            contacts={contacts}
                    createGroup={createGroup}
                    apiBase={API_BASE}
                    token={token}
                    getSavedContactName={getSavedContactName}
          />

          {/* ALL MODALS AND OVERLAYS */}
          <ChatModals
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            userId={userId}
            apiBase={API_BASE}
            token={token}
            setMyProfile={setMyProfile}
            setSelectedUserForDetails={setSelectedUserForDetails}
            setShowUserDetails={setShowUserDetails}
            showImageViewer={showImageViewer}
            handleCloseImageViewer={handleCloseImageViewer}
            viewingImageUrl={viewingImageUrl}
            selectedUserForDetails={selectedUserForDetails}
            showUserDetails={showUserDetails}
            handleCloseUserDetails={handleCloseUserDetails}
            loadingUserDetails={loadingUserDetails}
            handleViewPhoto={handleViewPhoto}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
            addContact={addContact}
            newIdentifier={newIdentifier}
            setNewIdentifier={setNewIdentifier}
            displayNameInput={displayNameInput}
            setDisplayNameInput={setDisplayNameInput}
            addMsg={addMsg}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            isDesktop={isDesktop}
            showSaveContact={showSaveContact}
            setShowSaveContact={setShowSaveContact}
            contactToSave={contactToSave}
            onSaveContactSuccess={handleSaveContactSuccess}
            getSavedContactName={getSavedContactName}
          />

          {/* CSS for custom scrollbar and patterns */}
          <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .bg-pattern { background-color: #e5e7eb; opacity: 0.8; }
      `}</style>
        </>
      )}
    </div>
  )
}
