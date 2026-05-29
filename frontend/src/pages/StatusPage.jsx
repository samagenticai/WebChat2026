import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImg from '../components/user/AvatarImg';
import StatusViewerPanel from '../components/status/StatusViewerPanel';
import MyStatusViewerComponent from '../components/status/MyStatusViewerComponent';
import session from '../session';
import { Plus, X, ArrowLeft, MoreVertical, Send, ChevronLeft, ChevronRight, Shield, MessageCircle, Eye, Crop } from 'lucide-react';
import UploadForm from '../components/status/UploadForm';

export default function StatusPage({ API_BASE }) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [myStatuses, setMyStatuses] = useState([]);
  const [visibleStatuses, setVisibleStatuses] = useState([]);
  const [selectedStatusUser, setSelectedStatusUser] = useState(null);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const [statusViewers, setStatusViewers] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [caption, setCaption] = useState(''); // caption for new status upload
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [statusReplies, setStatusReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [uploadTime, setUploadTime] = useState(null);

  const token = session.getToken();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfileAndStatuses();

    // Poll for real-time updates every 5 seconds
    const pollInterval = setInterval(() => {
      fetchProfileAndStatuses();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [token, navigate, API_BASE]);

  const fetchProfileAndStatuses = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, mRes, fRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/profile`, { headers }),
        fetch(`${API_BASE}/api/status/my`, { headers }),
        fetch(`${API_BASE}/api/status/feed`, { headers })
      ]);

      if (pRes.ok) setMyProfile((await pRes.json()).user);
      if (mRes.ok) setMyStatuses((await mRes.json()).statuses || []);
      if (fRes.ok) setVisibleStatuses((await fRes.json()).statuses || []);
    } catch (err) { console.error('Fetch error:', err); }
  };

  const handleNextStatus = () => {
    if (selectedStatusUser && selectedStatusUser.statuses.length > selectedStatusIndex + 1) {
      setSelectedStatusIndex(selectedStatusIndex + 1);
    } else {
      setSelectedStatusUser(null);
      setSelectedStatusIndex(0);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    if (!statusId) return;
    try {
      const res = await fetch(`${API_BASE}/api/status/${statusId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // refresh feed
        await fetchProfileAndStatuses();
        setSelectedStatusUser(null);
      }
    } catch (err) {
      console.error('[deleteStatus error]', err);
    }
  };

  const cropImage = () => {
    if (!preview || !selectedFile || !selectedFile.type.startsWith('image')) return;
    const img = new Image();
    img.src = preview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
      canvas.toBlob(blob => {
        if (blob) {
          const croppedFile = new File([blob], selectedFile.name, { type: selectedFile.type });
          setSelectedFile(croppedFile);
          setPreview(URL.createObjectURL(blob));
        }
      }, selectedFile.type);
    };
  };

  const handleCrop = cropImage;

  // Calculate current status early so it's available in all effects
  const currentStatus = selectedStatusUser?.statuses[selectedStatusIndex];

  // Mark status as viewed when displayed
  const markStatusAsViewed = async (statusId) => {
    if (!statusId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/status/${statusId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status && data.status.viewers) {
          setStatusViewers(data.status.viewers || []);
        }
      }
    } catch (err) {
      console.error('[markStatusAsViewed error]', err);
    }
  };

  // Send reply to status poster
  const sendReply = async () => {
    // guard against invalid state – the viewer should always have a currentStatus
    if (!replyText.trim() || !selectedStatusUser || !currentStatus) return;

    setIsSendingReply(true);
    try {
      // send recipientId explicitly instead of relying purely on username/phone lookup
      const body = {
        recipientId: selectedStatusUser.user._id,
        text: replyText,
        statusReply: {
          filePath: currentStatus.filePath,
          fileType: currentStatus.fileType,
          createdAt: currentStatus.createdAt
        }
      };
      // still include identifier for backward‑compatibility (optional)
      if (selectedStatusUser.user.username || selectedStatusUser.user.phone) {
        body.identifier = selectedStatusUser.user.username || selectedStatusUser.user.phone;
      }

      const res = await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setReplyText('');
        setShowReplyModal(false);
        alert('✅ Reply sent!');
      } else {
        const errText = await res.text();
        console.warn('[sendReply] server error:', errText);
        alert('Failed to send reply: ' + (errText || res.statusText));
      }
    } catch (err) {
      console.error('[sendReply error]', err);
      alert('Error sending reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Fetch replies for a status (for own statuses)
  const fetchStatusReplies = async (statusId) => {
    if (!statusId || !token) return;

    setLoadingReplies(true);
    try {
      const res = await fetch(`${API_BASE}/api/status/${statusId}/replies`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStatusReplies(data.replies || []);
      } else {
        setStatusReplies([]);
      }
    } catch (err) {
      console.error('[fetchStatusReplies error]', err);
      setStatusReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Polling for real-time viewer updates - fetch status data every 2 seconds
  useEffect(() => {
    if (!selectedStatusUser || !currentStatus) return;

    const pollViewers = async () => {
      if (!currentStatus._id || !token) return;
      try {
        const res = await fetch(`${API_BASE}/api/status/${currentStatus._id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status.viewers) {
            setStatusViewers(data.status.viewers || []);
          }
        }

        // Also fetch replies if this is own status
        const isOwnStatus = selectedStatusUser && String(selectedStatusUser.user._id) === String(session.getUserId());
        if (isOwnStatus && currentStatus._id) {
          fetchStatusReplies(currentStatus._id);
        }
      } catch (err) {
        // Silent error - don't spam console
      }
    };

    // Poll every 2 seconds for real-time viewer updates
    const pollInterval = setInterval(pollViewers, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedStatusUser, selectedStatusIndex, currentStatus, token, API_BASE]);

  // Progress bar and auto-advance effect
  useEffect(() => {
    if (!selectedStatusUser || !currentStatus) return;

    // Mark this status as viewed
    markStatusAsViewed(currentStatus._id);

    // If this is own status, fetch replies
    const isOwnStatus = String(selectedStatusUser.user._id) === String(session.getUserId());
    if (isOwnStatus) {
      fetchStatusReplies(currentStatus._id);
    } else {
      setStatusReplies([]);
    }

    setProgress(0); // Reset progress when status changes

    const isVideo = currentStatus.fileType === 'video';

    // For videos, track progress based on video duration
    if (isVideo && videoRef.current) {
      const vidElement = videoRef.current;

      const handleVideoEnd = () => {
        setProgress(100);
        if (selectedStatusUser.statuses.length > selectedStatusIndex + 1) {
          setSelectedStatusIndex(selectedStatusIndex + 1);
        } else {
          setSelectedStatusUser(null);
          setSelectedStatusIndex(0);
        }
      };

      const handleTimeUpdate = () => {
        if (vidElement.duration) {
          const newProgress = (vidElement.currentTime / vidElement.duration) * 100;
          setProgress(Math.min(newProgress, 100));
        }
      };

      // Add event listeners
      vidElement.addEventListener('ended', handleVideoEnd);
      vidElement.addEventListener('timeupdate', handleTimeUpdate);

      // Ensure video plays
      vidElement.play().catch(err => console.log('Autoplay failed:', err));

      return () => {
        vidElement.removeEventListener('ended', handleVideoEnd);
        vidElement.removeEventListener('timeupdate', handleTimeUpdate);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };
    }

    // For images, use 15 seconds timer-based progress
    const duration = 15; // 15 seconds for images
    let elapsed = 0;
    progressIntervalRef.current = setInterval(() => {
      elapsed += 100; // 100ms increments
      const newProgress = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressIntervalRef.current);
        // Auto-advance to next status
        if (selectedStatusUser.statuses.length > selectedStatusIndex + 1) {
          setSelectedStatusIndex(selectedStatusIndex + 1);
        } else {
          setSelectedStatusUser(null);
          setSelectedStatusIndex(0);
        }
      }
    }, 100);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [selectedStatusUser, selectedStatusIndex]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // reset caption whenever a new file is chosen
    setCaption('');
    setUploadTime(new Date());

    if (file.type.startsWith('video')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        if (video.duration > 60) {
          alert('Video 60 seconds se zyada nahi ho sakti');
          return;
        }
        setVideoDuration(Math.round(video.duration));
        setPreview(URL.createObjectURL(file));
        setSelectedFile(file);
      };
    } else {
      setPreview(URL.createObjectURL(file));
      setSelectedFile(file);
      setVideoDuration(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', selectedFile);
    if (videoDuration) fd.append('duration', videoDuration);
    if (caption) fd.append('caption', caption);

    try {
      const res = await fetch(`${API_BASE}/api/status/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        setSelectedFile(null);
        setPreview(null);
        setUploadTime(null);
        setCaption('');
        await fetchProfileAndStatuses();
      }
    } catch (err) { alert('Upload failed'); }
    finally { setIsUploading(false); }
  };

  // when preview closes, reset caption too
  useEffect(() => {
    if (!preview) setCaption('');
  }, [preview]);

  const statusGroups = (() => {
    const grouped = {};
    visibleStatuses.forEach(s => {
      const uid = s.userId._id || s.userId;
      if (!grouped[uid]) grouped[uid] = { user: s.userId, statuses: [] };
      grouped[uid].statuses.push(s);
    });
    return Object.values(grouped);
  })();

  const myViewerCount = myStatuses.reduce((a, s) => a + (s.viewers?.length || 0), 0);

  return (
    <div className="h-screen w-full bg-white flex overflow-hidden font-sans relative">

      {/* --- LEFT SIDE: LIST --- */}
      <div className={`w-full md:w-100 border-r border-slate-100 flex flex-col bg-white shrink-0 transition-all duration-300 ${selectedStatusUser || preview ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chat')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 italic">Status</h2>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-full transition-colors">
            <Plus size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          {/* My Status */}
          <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer group mb-2" onClick={() => {
            if (myStatuses.length > 0 && myProfile) {
              setSelectedStatusUser({ user: myProfile, statuses: myStatuses });
              setSelectedStatusIndex(0);
            } else {
              fileInputRef.current?.click();
            }
          }}>
            <div className="relative">
              <div className="w-14 h-14 rounded-full p-0.5 border-2 border-slate-200">
                <AvatarImg src={myProfile?.avatar} username={myProfile?.username} size="w-full h-full rounded-full" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-white">
                <Plus size={12} strokeWidth={4} />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">My Status</h4>
              <p className="text-xs text-slate-500">{myStatuses.length > 0 ? `${myStatuses.length} updates` : 'Tap to add status'}</p>

            </div>
          </div>

          <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Updates</div>

          {statusGroups
            .filter(group => !(myProfile && String(group.user._id) === String(myProfile._id)))
            .map((group) => {
              const totalViewers = group.statuses.reduce((acc, s) => acc + (s.viewers?.length || 0), 0);
              const isOwnStatus = String(group.user._id) === String(session.getUserId());
              const statusCount = group.statuses.length;

              // Create conic-gradient for segmented border based on status count
              const segmentAngle = 360 / statusCount;
              const gradientSegments = Array.from({ length: statusCount })
                .map((_, i) => `indigo-600 ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
                .join(', ');

              return (
                <div key={group.user._id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50/50 cursor-pointer transition-all" onClick={() => { setSelectedStatusUser(group); setSelectedStatusIndex(0); }}>
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full p-0.5 shadow-md shadow-indigo-200"
                      style={{
                        background: `conic-gradient(${gradientSegments})`,
                        padding: '2px'
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-white p-0.5">
                        <AvatarImg src={group.user.avatar} username={group.user.username} size="w-full h-full rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-2">
                    <h4 className="font-bold text-slate-900">{group.user.displayName || group.user.username}</h4>
                    <p className="text-xs text-slate-400">{new Date(group.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    {group.statuses[0].caption && (
                      <p className="text-xs text-slate-400 mt-1 truncate">{group.statuses[0].caption}</p>
                    )}
                    {isOwnStatus && totalViewers > 0 && (
                      <p className="text-[10px] text-indigo-600 font-semibold mt-1">👁️ {totalViewers} views</p>
                    )}
                    {statusCount > 1 && !isOwnStatus && (
                      <p className="text-[10px] text-indigo-500 font-semibold mt-1">{statusCount} statuses</p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* --- RIGHT SIDE: PREVIEW OR VIEWER --- */}
      <div className={`flex-1 flex-col bg-slate-950 relative ${selectedStatusUser || preview ? 'flex' : 'hidden md:flex md:bg-slate-50'}`}>

        {/* Close Button (Desktop Only) */}
        <button onClick={() => { setSelectedStatusUser(null); setPreview(null); }} className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full hidden md:block">
          <X size={24} />
        </button>

        {preview ? (
          <UploadForm
            preview={preview}
            selectedFile={selectedFile}
            uploadTime={uploadTime}
            isUploading={isUploading}
            setPreview={setPreview}
            setUploadTime={setUploadTime}
            handleUpload={handleUpload}
            handleCrop={handleCrop}
            caption={caption}
            setCaption={setCaption}
            userAvatar={myProfile?.avatar}
          />
        ) : selectedStatusUser ? (
          /* choose appropriate viewer component with side reply box */
          <div className="relative w-full h-full">
            {String(selectedStatusUser.user._id) === String(myProfile?._id) ? (
              <MyStatusViewerComponent
                selectedStatusUser={selectedStatusUser}
                selectedStatusIndex={selectedStatusIndex}
                currentStatus={currentStatus}
                statusViewers={statusViewers}
                statusReplies={statusReplies}
                onSetStatusUser={setSelectedStatusUser}
                onSetStatusIndex={setSelectedStatusIndex}
                onDeleteStatus={handleDeleteStatus}
                videoRef={videoRef}
                API_BASE={API_BASE}
                handleNextStatus={handleNextStatus}
                progress={progress}
              />
            ) : (
              <StatusViewerPanel
                selectedStatusUser={selectedStatusUser}
                selectedStatusIndex={selectedStatusIndex}
                currentStatus={currentStatus}
                statusViewers={statusViewers}
                onSetStatusUser={setSelectedStatusUser}
                onSetStatusIndex={setSelectedStatusIndex}
                onDeleteStatus={handleDeleteStatus}
                videoRef={videoRef}
                API_BASE={API_BASE}
                handleNextStatus={handleNextStatus}
                progress={progress}
                preview={preview}
                selectedFile={selectedFile}
                isUploading={isUploading}
                onSetPreview={setPreview}
                onSetSelectedFile={setSelectedFile}
                onHandleUpload={handleUpload}
                myProfile={myProfile}
                replyText={replyText}
                onSetReplyText={setReplyText}
                onSendReply={sendReply}
                isSendingReply={isSendingReply}
              />
            )}
          </div>
        ) : (          /* --- DESKTOP EMPTY STATE --- */
          <div className="hidden md:flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-white rounded-4xl shadow-sm flex items-center justify-center mb-6">
              <Shield className="text-slate-200" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Status Updates</h2>
            <p className="text-slate-500 max-w-xs">Share moments with your friends. Statuses disappear after 24 hours.</p>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />

      {/* Reply Modal */}
      {showReplyModal && selectedStatusUser && currentStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-999 md:items-center md:justify-center">
          <div className="w-full md:w-96 bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="text-lg font-bold text-slate-900">Reply to {selectedStatusUser.user.displayName || selectedStatusUser.user.username}</h3>
              <button onClick={() => setShowReplyModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Status Preview - Clickable */}
            <div
              onClick={() => setShowReplyModal(false)}
              className="shrink-0 px-4 py-3 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition group"
            >
              <p className="text-xs font-semibold text-slate-500 mb-2">REPLYING TO (Click to view full)</p>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-black overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition">
                  {currentStatus.fileType === 'video' ? (
                    <video src={`${API_BASE}${currentStatus.filePath}`} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`${API_BASE}${currentStatus.filePath}`} alt="status" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    {currentStatus.fileType === 'video' ? '🎬 Video' : '📸 Image'}
                  </p>
                  <p className="text-xs text-slate-600">Posted at {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold mt-2">→ View full status</p>
                </div>
              </div>
            </div>

            {/* Reply Input */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                className="w-full h-24 p-3 border border-slate-200 rounded-lg resize-none outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 text-sm"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl sticky bottom-0">
              <button
                onClick={() => setShowReplyModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={isSendingReply || !replyText.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {isSendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

