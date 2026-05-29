import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import session from './session'
import SettingsModal from './SettingsModal'
import { resolveApiBase } from './apiBase'

const API_BASE = resolveApiBase();

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [recipient, setRecipient] = useState('')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [contacts, setContacts] = useState([])
  const [personalContacts, setPersonalContacts] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [activeContact, setActiveContact] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showSaveContactModal, setShowSaveContactModal] = useState(false)
  const [contactFormName, setContactFormName] = useState('')
  const [contactStatus, setContactStatus] = useState('')
  const [newIdentifier, setNewIdentifier] = useState('')
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [addMsg, setAddMsg] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [myProfile, setMyProfile] = useState(null)
  const [viewportHeight, setViewportHeight] = useState('100dvh')
  const menuRef = useRef(null)
  const navigate = useNavigate();
  // show main chat area: on desktop always visible; on mobile only when sidebar is closed
  const mainVisible = isDesktop || !showSidebar;

  const scrollRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [token, setToken] = useState(session.getToken());
  const [userId, setUserId] = useState(session.getUserId());

  useEffect(() => {
    const unsubscribe = session.subscribe(() => {
      setToken(session.getToken());
      setUserId(session.getUserId());
    });
    return unsubscribe;
  }, []);

  if (token && !userId) {
    return <div className="flex items-center justify-center h-screen">Loading your chat...</div>;
  }

  // Mark user as online and keep-alive
  useEffect(() => {
    if (!token || !userId) return;

    // Mark as online immediately
    const markOnline = async () => {
      try {
        await fetch(`${API_BASE}/api/users/online`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) { }
    };

    markOnline();

    // Keep-alive: refresh online status every 10 seconds
    const keepAliveInterval = setInterval(markOnline, 10000);

    // Mark as offline on page unload
    const handleBeforeUnload = () => {
      fetch(`${API_BASE}/api/users/offline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true
      }).catch(() => { });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(keepAliveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token, userId]);

  // Fetch current user's profile for menu label
  useEffect(() => {
    let mounted = true;
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const d = await res.json();
        if (!mounted) return;
        if (d.user) {
          const user = { ...d.user };
          if (user.avatar && user.avatar.startsWith('/')) user.avatar = `${API_BASE}${user.avatar}`;
          setMyProfile(user);
        }
      } catch (e) { }
    })();
    return () => { mounted = false; }
  }, [token]);

  // responsive desktop detection
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Visual Viewport handler for mobile keyboard
  useEffect(() => {
    if (!window.visualViewport) return;

    const maintainViewport = () => {
      setViewportHeight(`${window.visualViewport.height}px`);
      // Scroll to bottom when viewport shrinks
      if (scrollRef.current) {
        setTimeout(() => {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);
      }
    };

    window.visualViewport.addEventListener('resize', maintainViewport);
    maintainViewport(); // initial set

    return () => window.visualViewport.removeEventListener('resize', maintainViewport);
  }, []);

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

  // Mark messages as read when viewing a conversation (top-level hook)
  useEffect(() => {
    if (!token || !activeContact || !messages || messages.length === 0) return;

    try {
      const unreadMessages = messages.filter(m =>
        String(m.sender?._id) === String(activeContact._id) &&
        String(m.recipient?._id) === String(userId) &&
        !m.read
      );

      if (unreadMessages.length > 0) {
        fetch(`${API_BASE}/api/messages/read-bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ contactId: activeContact._id })
        }).catch(err => console.error('[ChatPage] Failed to mark as read:', err));
      }
    } catch (e) {
      console.error('[ChatPage] mark-as-read error', e);
    }
  }, [activeContact?._id, token, messages, userId, API_BASE]);

  const mergeContactsFromMessages = (msgs, myId, existingContacts) => {
    const map = {};

    // First, add all existing (saved) contacts to the map
    existingContacts.forEach(c => {
      if (c?._id) {
        map[String(c._id)] = {
          _id: c._id,
          displayName: c.displayName || c.username || 'Unknown',
          username: c.username || '',
          phone: c.phone || '',
          email: c.email || '',
          avatar: c.avatar ? (c.avatar.startsWith('/') ? `${API_BASE}${c.avatar}` : c.avatar) : ''
        };
      }
    });

    // Then, enhance with message data
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
            displayName: other.username || other.displayName || 'Unknown',
            username: other.username || '',
            phone: other.phone || '',
            email: other.email || '',
            avatar: other.avatar ? (other.avatar.startsWith('/') ? `${API_BASE}${other.avatar}` : other.avatar) : ''
          };
          // Merge but preserve existing displayName if it was set
          map[otherId] = map[otherId] ? { ...map[otherId], ...newData, displayName: map[otherId].displayName } : newData;
        }
      } catch (e) { }
    });
    return Object.values(map);
  };

  const checkOnlineStatus = async (contactsList) => {
    if (!token || contactsList.length === 0) return;
    try {
      const userIds = contactsList.map(c => c._id).join(',');
      const res = await fetch(`${API_BASE}/api/users/online-status?userIds=${userIds}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setOnlineUsers(new Set(d.online || []));
      }
    } catch (err) { }
  };

  const isContactOnline = (contactId) => {
    return onlineUsers.has(String(contactId));
  };

  useEffect(() => {
    if (!token) {
      console.log('[ChatPage] No token, skipping initial load');
      return;
    }

    console.log('[ChatPage] Token present, loading messages and contacts...');

    // Fetch messages, users/contacts, and personal contacts
    Promise.all([
      fetch(`${API_BASE}/api/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      }).then(r => {
        console.log('[ChatPage] Messages response:', r.status);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(`${API_BASE}/api/users/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      }).then(r => {
        console.log('[ChatPage] Contacts response:', r.status);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(`${API_BASE}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : { contacts: [] })
    ])
      .then(([messagesData, contactsData, personalData]) => {
        const messages = messagesData.messages || [];
        const savedContacts = contactsData.contacts || [];
        setPersonalContacts(personalData.contacts || []);

        console.log('[ChatPage] Loaded messages:', messages.length, 'contacts:', savedContacts.length, 'personal:', personalData.contacts?.length);
        console.log('[ChatPage] Current userId:', userId);
        setMessages(messages);

        // Merge saved contacts with contacts from messages
        const extractedContacts = mergeContactsFromMessages(messages, userId, savedContacts);
        console.log('[ChatPage] Merged contacts:', extractedContacts.length);
        setContacts(extractedContacts);
        checkOnlineStatus(extractedContacts);

        // If no active contact selected, auto-select the first conversation and set recipient
        setActiveContact(prev => {
          if (prev) return prev;
          const first = extractedContacts.length ? extractedContacts[0] : null;
          if (first) {
            console.log('[ChatPage] Auto-selected first contact:', first.displayName);
            setRecipient(first.phone || first.username || '');
          }
          return first;
        });
      })
      .catch((err) => {
        console.error('[ChatPage] Failed to load contacts/messages:', err);
        setStatus(`Error: ${err.message}`);
      });
  }, [token, userId])

  // Poll messages every 3 seconds
  useEffect(() => {
    if (!token || !userId) {
      console.log('[ChatPage] No token or userId, skipping poll setup');
      return;
    }

    console.log('[ChatPage] Setting up message polling...');
    const interval = setInterval(async () => {
      try {
        const [messagesRes, contactsRes, personalRes] = await Promise.all([
          fetch(`${API_BASE}/api/messages/inbox`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
          }),
          fetch(`${API_BASE}/api/users/contacts`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
          }),
          fetch(`${API_BASE}/api/contacts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (messagesRes.ok && contactsRes.ok && personalRes.ok) {
          const messagesData = await messagesRes.json();
          const contactsData = await contactsRes.json();
          const personalData = await personalRes.json();
          console.log('[ChatPage] Poll: messages:', messagesData.messages?.length, 'contacts:', contactsData.contacts?.length);
          setPersonalContacts(personalData.contacts || []);
          if (messagesData.messages) {
            setMessages(messagesData.messages);
            const savedContacts = contactsData.contacts || [];
            const updated = mergeContactsFromMessages(messagesData.messages, userId, savedContacts);
            setContacts(updated);
            checkOnlineStatus(updated);
            // ensure an active contact is selected if none and set recipient
            setActiveContact(prev => {
              if (prev) return prev;
              const first = updated.length ? updated[0] : null;
              if (first) {
                console.log('[ChatPage] Auto-selected from poll:', first.displayName);
                setRecipient(first.phone || first.username || '');
              }
              return first;
            });
          }
        } else {
          console.warn('[ChatPage] Poll response not ok:', messagesRes.status, contactsRes.status);
        }
      } catch (err) {
        console.error('[ChatPage] Poll error:', err);
      }
    }, 3000);
    return () => {
      console.log('[ChatPage] Clearing poll interval');
      clearInterval(interval);
    };
  }, [token, userId]);

  const logout = () => {
    // Mark as offline before logout
    if (token) {
      fetch(`${API_BASE}/api/users/offline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true
      }).catch(() => { });
    }

    // Clear all session data
    session.clear();

    // Redirect to login
    window.location.href = '/login';
  };

  const send = async () => {
    if (!recipient || !text.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ identifier: recipient, text })
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
              const updated = mergeContactsFromMessages(d.messages, userId, prev);
              checkOnlineStatus(updated);
              return updated;
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

  const triggerImageSelect = () => {
    if (imageInputRef.current) imageInputRef.current.click();
  }

  const triggerVideoSelect = () => {
    if (videoInputRef.current) videoInputRef.current.click();
  }

  const uploadMedia = async (file, type) => {
    if (!activeContact || !activeContact._id) return setStatus('Select a contact to send media');
    if (!file) return setStatus('No file selected');
    try {
      setStatus('Uploading ' + type + '...');
      const fm = new FormData();
      if (type === 'image') fm.append('image', file);
      if (type === 'video') fm.append('video', file);
      fm.append('recipientId', activeContact._id);
      fm.append('text', text || '');

      const url = `${API_BASE}/api/messages/${type === 'image' ? 'send-image' : 'send-video'}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fm
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorMsg = err.error || `Upload failed (HTTP ${res.status})`;
        console.error(`[uploadMedia ${type}] Error:`, errorMsg, 'Response:', err);
        setStatus(errorMsg);
        return;
      }
      const data = await res.json();
      console.log(`[uploadMedia ${type}] Success:`, { message: data.message, hasMedia: !!data.message?.[type] });

      setText('');
      setStatus('');

      // Immediately add message to state to show instant feedback
      if (data.message) {
        setMessages(prev => [data.message, ...prev]);
      }

      // Then refresh inbox to sync with other devices
      setTimeout(async () => {
        const inbox = await fetch(`${API_BASE}/api/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } });
        if (inbox.ok) {
          const d = await inbox.json();
          if (d.messages) {
            setMessages(d.messages || []);
            const updated = mergeContactsFromMessages(d.messages || [], userId, contacts);
            setContacts(updated);
            checkOnlineStatus(updated);
          }
        }
      }, 500);
    } catch (err) {
      console.error('[ChatPage] uploadMedia error', err);
      setStatus('Upload failed: ' + (err.message || String(err)));
    }
  }

  const onImageSelected = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    uploadMedia(f, 'image');
    e.target.value = '';
  }

  const onVideoSelected = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    uploadMedia(f, 'video');
    e.target.value = '';
  }

  const selectContact = (c) => {
    setActiveContact(c);
    setRecipient(c.phone || c.username);
    setShowSidebar(false);
  }

  const addContact = async () => {
    if (!newIdentifier) return setAddMsg('Provide phone or username');
    console.log('[ChatPage] Adding contact:', newIdentifier, 'displayName:', displayNameInput);
    try {
      const res = await fetch(`${API_BASE}/api/users/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ identifier: newIdentifier, displayName: displayNameInput })
      });
      console.log('[ChatPage] Add contact response:', res.status, res.statusText);
      const d = await res.json();
      console.log('[ChatPage] Add contact response body:', d);
      if (!res.ok) return setAddMsg(d.error || `Failed to add (HTTP ${res.status})`);
      const rawAv = d.user.avatar || '';
      const added = { _id: d.user._id, displayName: d.displayName || d.user.username, username: d.user.username, phone: d.user.phone, email: d.user.email, avatar: rawAv && rawAv.startsWith('/') ? `${API_BASE}${rawAv}` : rawAv };
      console.log('[ChatPage] Contact added successfully:', added);
      setContacts(c => [added, ...c.filter(x => String(x._id) !== String(added._id))]);
      setShowAdd(false);
      setNewIdentifier('');
      setDisplayNameInput('');
      setAddMsg('');
    } catch (err) {
      console.error('[ChatPage] Add contact error:', err);
      setAddMsg('Error: ' + (err.message || 'Network error'));
    }
  }

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactFormName.trim()) return setContactStatus('Name is required');
    try {
      const res = await fetch(`${API_BASE}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customName: contactFormName, phoneNumber: activeContact?.phone })
      });
      if (res.ok) {
        const d = await res.json();
        // Insert new contact or update existing locally
        setPersonalContacts(prev => {
          const filtered = prev.filter(c => c.phoneNumber !== d.contact.phoneNumber);
          return [d.contact, ...filtered];
        });
        setShowSaveContactModal(false);
        setContactFormName('');
        setContactStatus('');
      } else {
        const err = await res.json();
        setContactStatus(err.error || 'Failed to save contact');
      }
    } catch (err) {
      setContactStatus('Error: ' + err.message);
    }
  };

  return (
    <div
      className="flex bg-[#f0f2f5] font-sans antialiased text-slate-800 fixed inset-0 overflow-hidden w-full"
      style={{ height: viewportHeight }}
    >

      {/* Mobile Overlay when sidebar is open */}
      {showSidebar && !isDesktop && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-30 w-full sm:w-80 md:w-[380px] h-full min-w-0
        bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto
      `}>
        {/* Profile Header */}
        <div className="p-4 bg-slate-50 flex justify-between items-center border-b">
          <div className={`flex items-center gap-3 flex-1`}>
            <div className={`w-10 h-10 rounded-full shadow-lg shadow-indigo-200 overflow-hidden flex-shrink-0 ${myProfile?.avatar ? 'bg-white border-2 border-white' : 'bg-indigo-600'}`}>
              {myProfile?.avatar ? (
                <img src={myProfile.avatar} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                  {(myProfile?.username || '').charAt(0)?.toUpperCase() || 'M'}
                </div>
              )}
            </div>
            {myProfile && (
              <div className="leading-tight hidden sm:block min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">{myProfile.username || 'Me'}</div>
                <div className="text-xs text-slate-500 truncate">{myProfile.phone || ''}</div>
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              title="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[200px] sm:min-w-[220px]">
                <button
                  onClick={() => { navigate('/profile'); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 transition-colors text-sm"
                  title="Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 21h13" /></svg>
                  Profile
                </button>
                <button
                  onClick={() => { setShowAdd(true); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 transition-colors text-sm"
                  title="Add Contact"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                  Add Contact
                </button>
                <button
                  onClick={() => { logout(); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar Placeholder */}
        <div className="p-2 sm:p-3">
          <div className="relative">
            <input type="text" placeholder="Search..." className="w-full bg-slate-100 border-none rounded-xl px-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <svg className="absolute left-3 top-2.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
        </div>

        {/* Contacts List or Profile (desktop) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.filter(c => String(c._id) !== String(userId)).length === 0 && (
            <div className="p-4 sm:p-10 text-center text-slate-400">
              <p className="text-sm">No conversations yet.</p>
            </div>
          )}
          {contacts.filter(c => String(c._id) !== String(userId)).map(c => (
            <div
              key={c._id}
              onClick={() => selectContact(c)}
              className={`flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-all border-b border-slate-50 ${activeContact?._id === c._id ? 'bg-indigo-50 border-r-4 border-r-indigo-600' : 'hover:bg-slate-50'}`}
            >
              <div className="relative w-12 h-12 flex-shrink-0">
                {c.avatar ? (
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                    <img src={c.avatar} alt={c.displayName || c.username} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 border-2 border-white shadow-sm text-sm">
                    {(c.displayName || c.username)[0].toUpperCase()}
                  </div>
                )}
                {isContactOnline(c._id) && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-semibold text-slate-900 truncate text-base md:text-sm">
                    {personalContacts.find(p => p.phoneNumber === c.phone)?.customName || c.displayName || c.username || c.phone || 'Unknown'}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 truncate">{c.phone || c.email || 'No status'}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className={`${mainVisible ? 'flex' : 'hidden'} flex-1 flex flex-col bg-[#e5e7eb] relative min-w-0 overflow-hidden`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center px-3 sm:px-4 justify-between z-10 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 -ml-2 text-indigo-600 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                </button>
                <div className="relative w-10 h-10 flex-shrink-0">
                  {activeContact?.avatar ? (
                    <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center border-2 border-white">
                      <img src={activeContact.avatar} alt={activeContact.displayName || activeContact.username} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                      {(personalContacts.find(p => p.phoneNumber === activeContact.phone)?.customName || activeContact.displayName || activeContact.username || activeContact.phone || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {isContactOnline(activeContact._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                    {personalContacts.find(p => p.phoneNumber === activeContact.phone)?.customName || activeContact.phone || 'Unknown User'}
                  </h3>
                  <span className={`text-[10px] sm:text-[11px] font-medium ${isContactOnline(activeContact._id) ? 'text-green-500' : 'text-slate-400'}`}>
                    {isContactOnline(activeContact._id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </header>

            {/* Unsaved Contact Banner */}
            {activeContact && !personalContacts.some(c => c.phoneNumber === activeContact.phone) && (
              <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-sm relative z-10 transition-all duration-300">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-slate-800 text-sm sm:text-base truncate">{activeContact.phone || 'Unknown User'}</span>
                  <span className="text-xs text-slate-500">Not in your contacts</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setContactFormName('');
                      setShowSaveContactModal(true);
                      setContactStatus('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg transition-colors text-xs sm:text-sm shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M19 8v6" /><path d="M16 11h6" /></svg>
                    <span className="hidden sm:inline">Save Contact</span>
                    <span className="inline sm:hidden">Save</span>
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                  </button>
                </div>
              </div>
            )}

            {/* Message Thread */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 bg-pattern flex flex-col min-h-0 chat-scroll"
              style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}
            >
              <div className="flex flex-col gap-2">
                {(() => {
                  const filtered = messages.filter(m => {
                    const me = String(userId);
                    const other = String(activeContact._id);
                    const sId = m.sender?._id ? String(m.sender._id) : null;
                    const rId = m.recipient?._id ? String(m.recipient._id) : null;
                    const match = (sId === me && rId === other) || (sId === other && rId === me);
                    if (!match) {
                      console.log('Message filtered out - userId:', userId, 'activeContact:', activeContact._id, 'sender:', sId, 'recipient:', rId);
                    }
                    return match;
                  });
                  // Ensure messages render oldest-first so newest appear at the bottom
                  const ordered = filtered.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                  console.log('Total messages:', messages.length, 'Filtered messages:', filtered.length, 'Ordered messages:', ordered.length, 'userId:', userId, 'activeContact:', activeContact?._id);

                  // (moved: marking messages as read is handled in a top-level useEffect)

                  return ordered.map((m) => {
                    const isMe = String(m.sender?._id) === String(userId);
                    // choose avatar: myProfile (already normalized) for self, otherwise use message sender avatar
                    const rawAvatar = isMe ? (myProfile?.avatar || '') : (m.sender?.avatar || '');
                    const avatar = rawAvatar && rawAvatar.startsWith('/') ? `${API_BASE}${rawAvatar}` : rawAvatar;

                    // Helper function to render status icon
                    const renderStatusIcon = () => {
                      // Only show status for messages sent by current user
                      if (!isMe) return null;

                      const iconSize = 'w-4 h-4';

                      // Read (blue double checkmark)
                      if (m.read) {
                        return (
                          <svg className={`${iconSize} text-blue-400 ml-1`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /><path d="M9 16.2l5 5.4 8-8.4-1.4-1.4L14 18.6l-3.6-3.6L9 16.2z" fillOpacity="0.5" />
                          </svg>
                        );
                      }

                      // Delivered (double checkmark)
                      if (m.delivered) {
                        return (
                          <svg className={`${iconSize} text-slate-400 ml-1`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /><path d="M9 16.2l5 5.4 8-8.4-1.4-1.4L14 18.6l-3.6-3.6L9 16.2z" fillOpacity="0.5" />
                          </svg>
                        );
                      }

                      // Sent (single checkmark)
                      return (
                        <svg className={`${iconSize} text-slate-300 ml-1`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                        </svg>
                      );
                    };

                    return (
                      <div key={m._id} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 gap-2`}>
                        {/* avatar on left for others */}
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm">
                            {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">{(m.sender?.username || 'U')[0].toUpperCase()}</div>}
                          </div>
                        )}

                        <div className={`
                          max-w-[90%] sm:max-w-[85%] md:max-w-[70%] px-3 sm:px-4 py-2 shadow-sm
                          ${isMe ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' : 'bg-white text-slate-800 rounded-2xl rounded-tl-none'}
                        `}>
                          {/* Render image if present */}
                          {m.image?.path && (
                            <div className="mb-2">
                              <img
                                src={m.image.path.startsWith('/') ? `${API_BASE}${m.image.path}` : m.image.path}
                                alt="shared image"
                                className="w-full rounded-lg max-w-sm object-cover"
                                onError={(e) => {
                                  console.error('[ChatPage] Failed to load image:', m.image.path);
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          {/* Render video if present */}
                          {m.video?.path && (
                            <div className="mb-2">
                              <video
                                src={m.video.path.startsWith('/') ? `${API_BASE}${m.video.path}` : m.video.path}
                                controls
                                className="w-full rounded-lg max-w-sm"
                                onError={(e) => console.error('[ChatPage] Failed to load video:', m.video.path)}
                              />
                            </div>
                          )}

                          {/* Render audio if present */}
                          {m.audio?.path && (
                            <div className="mb-2">
                              <audio
                                src={m.audio.path.startsWith('/') ? `${API_BASE}${m.audio.path}` : m.audio.path}
                                controls
                                className="w-full rounded-lg"
                                onError={(e) => console.error('[ChatPage] Failed to load audio:', m.audio.path)}
                              />
                            </div>
                          )}

                          {/* Render text if present */}
                          {m.text && (
                            <p className="text-base md:text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                          )}

                          {/* Prevent completely empty bubbles */}
                          {!m.text && !m.image?.path && !m.video?.path && !m.audio?.path && (
                            <p className="text-xs italic text-gray-400">(media message)</p>
                          )}

                          <div className={`text-[10px] mt-1 flex justify-end items-center ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {renderStatusIcon()}
                          </div>
                        </div>

                        {/* avatar on right for self */}
                        {isMe && (
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm">
                            {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full flex items-center justify-center text-sm text-white">{(myProfile?.username || 'M')[0].toUpperCase()}</div>}
                          </div>
                        )}
                      </div>
                    )
                  });
                })()}
              </div>
            </div>
            <footer className="p-3 sm:p-4 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
              <div className="max-w-4xl mx-auto flex items-end gap-2 sm:gap-3">
                <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-3 sm:px-4 py-1 border border-transparent focus-within:border-indigo-300 transition-all">
                  <textarea
                    rows="1"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Type message..."
                    className="flex-1 bg-transparent border-none py-2 text-sm sm:text-base focus:ring-0 resize-none max-h-32 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={triggerImageSelect} className="mb-1 p-2 rounded-xl bg-white text-slate-600 hover:bg-slate-50 shadow-sm" title="Send image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </button>
                  <button type="button" onClick={triggerVideoSelect} className="mb-1 p-2 rounded-xl bg-white text-slate-600 hover:bg-slate-50 shadow-sm" title="Send video">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="15" height="12" rx="2" ry="2" /><polygon points="23 7 16 12 23 17 23 7" /></svg>
                  </button>
                  <button
                    onClick={send}
                    disabled={!text.trim()}
                    className={`mb-1 p-2 sm:p-3 rounded-xl transition-all ${text.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>
              </div>
              {/* hidden file inputs for media */}
              <input ref={imageInputRef} onChange={onImageSelected} type="file" accept="image/*" style={{ display: 'none' }} />
              <input ref={videoInputRef} onChange={onVideoSelected} type="file" accept="video/*" style={{ display: 'none' }} />
              {status && <div className="text-xs sm:text-sm text-red-500 mt-2">{status}</div>}
            </footer>
          </>
        ) : (
          <div className="hidden md:flex md:flex-1 md:flex-col md:items-center md:justify-center md:text-slate-400 md:p-10 md:text-center">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-600">Your Messages</h2>
            <p className="max-w-xs text-sm mt-2">Select a contact to start chatting or add a new one.</p>
          </div>
        )}
      </main>

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-800">New Contact</h3>
            <p className="text-slate-500 text-sm mb-6">Enter details to start a conversation.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Identifier</label>
                <input value={newIdentifier} onChange={e => setNewIdentifier(e.target.value)} placeholder="Phone or Username" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Name (Optional)</label>
                <input value={displayNameInput} onChange={e => setDisplayNameInput(e.target.value)} placeholder="Friendly name" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base" />
              </div>
            </div>

            {addMsg && <div className="mt-4 p-2 bg-red-50 text-red-500 text-xs rounded-lg border border-red-100">{addMsg}</div>}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors text-sm sm:text-base">Cancel</button>
              <button onClick={addContact} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-sm sm:text-base">Add Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Contact Modal — Premium Design */}
      {showSaveContactModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveContactModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ animation: 'scaleIn 0.22s cubic-bezier(.34,1.56,.64,1) both' }}
          >
            {/* Gradient Header */}
            <div className="relative px-6 pt-8 pb-6 text-center"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)' }}>
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-10"
                style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

              {/* Avatar bubble */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-white/30 shadow-xl mb-3"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                <span className="text-3xl font-bold text-white select-none">
                  {(activeContact?.phone || '?')[0]}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Save Contact</h3>
              <p className="text-indigo-200 text-sm">Add a personal name for this number</p>
            </div>

            {/* Form Body */}
            <div className="bg-white px-6 py-6 space-y-4">
              {/* Phone number (read-only) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                  📞 Phone Number
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.93 2 2 0 0 1 3.61 2.7h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.5l.18-.58z" /></svg>
                  <span className="text-slate-500 text-sm font-medium tracking-wide flex-1">{activeContact?.phone || 'Unknown'}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Fixed</span>
                </div>
              </div>

              {/* Custom name input */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                  ✏️ Your Custom Name
                </label>
                <input
                  autoFocus
                  value={contactFormName}
                  onChange={e => setContactFormName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveContact(e); }}
                  placeholder="e.g. Ali, Boss, Mom..."
                  className="w-full border-2 border-slate-200 focus:border-indigo-500 bg-white rounded-2xl px-4 py-3 text-slate-800 font-medium placeholder-slate-300 outline-none transition-all text-sm"
                  style={{ boxShadow: contactFormName ? '0 0 0 4px rgba(99,102,241,0.08)' : 'none' }}
                />
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Only visible to you — not shared with anyone</p>
              </div>

              {/* Error message */}
              {contactStatus && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {contactStatus}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowSaveContactModal(false); setContactStatus(''); setContactFormName(''); }}
                  className="flex-1 py-3 rounded-2xl text-slate-600 font-semibold border-2 border-slate-200 hover:bg-slate-50 transition-all text-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContact}
                  disabled={!contactFormName.trim()}
                  className="flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: contactFormName.trim() ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#94a3b8', boxShadow: contactFormName.trim() ? '0 8px 20px rgba(99,102,241,0.35)' : 'none' }}
                >
                  💾 Save Contact
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes scaleIn {
              from { opacity: 0; transform: scale(0.85) translateY(20px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Profile now has its own page at /profile (no modal) */}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={userId}
        apiBase={API_BASE}
      />

      {/* CSS for custom scrollbar and patterns */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .bg-pattern { background-color: #e5e7eb; opacity: 0.8; }
      `}</style>
    </div>
  )
}
