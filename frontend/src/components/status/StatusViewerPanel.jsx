import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Send, MoreVertical, Volume2, VolumeX, Trash2, Smile, Plus } from 'lucide-react';
import AvatarImg from '../user/AvatarImg';
import UploadForm from './UploadForm';

export default function StatusViewerComponent({
    selectedStatusUser,
    selectedStatusIndex,
    currentStatus,
    statusViewers,
    onSetStatusUser,
    onSetStatusIndex,
    onDeleteStatus,
    videoRef,
    API_BASE,
    handleNextStatus,
    progress,
    preview,
    selectedFile,
    isUploading,
    onSetPreview,
    onSetSelectedFile,
    onHandleUpload,
    myProfile,
    replyText,
    onSetReplyText,
    onSendReply,
    isSendingReply,
    uploadTime,
    setUploadTime,
    caption,
    setCaption,
}) {
    const [isMuted, setIsMuted] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(1);

    useEffect(() => {
        if (videoRef && videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.volume = isMuted ? 0 : volumeLevel;
        }
    }, [isMuted, volumeLevel, videoRef]);

    const cropPreviewImage = () => {
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
                    onSetSelectedFile(croppedFile);
                    onSetPreview(URL.createObjectURL(blob));
                }
            }, selectedFile.type);
        };
    };

    if (preview) {
        return (
            <div className="fixed inset-0 z-250 bg-black flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full md:max-w-112 md:h-screen bg-black flex flex-col md:rounded-3xl md:shadow-2xl overflow-hidden">
                    <UploadForm
                        preview={preview}
                        selectedFile={selectedFile}
                        uploadTime={uploadTime}
                        isUploading={isUploading}
                        setPreview={onSetPreview}
                        setUploadTime={setUploadTime}
                        handleUpload={onHandleUpload}
                        handleCrop={cropPreviewImage}
                        caption={caption}
                        setCaption={setCaption}
                        userId={myProfile?._id}
                    />
                </div>
            </div>
        );
    }

    if (!selectedStatusUser || !selectedStatusUser.statuses) return null;
    const safeCurrent = currentStatus || selectedStatusUser.statuses[selectedStatusIndex] || {};
    const isOwner = myProfile && selectedStatusUser?.user && String(selectedStatusUser.user._id) === String(myProfile._id);

    return (
        <div className="fixed inset-0 z-100 bg-black flex items-center justify-center overflow-hidden font-sans">
            <div className="relative w-full h-full md:h-[95vh] md:max-w-[420px] md:rounded-[2rem] overflow-hidden bg-black flex flex-col shadow-2xl">

                {/* --- Top: Progress Bars --- */}
                <div className="absolute top-3 left-0 right-0 flex gap-1.5 px-4 z-60">
                    {selectedStatusUser.statuses.map((_, idx) => (
                        <div key={idx} className="h-[2.5px] flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                style={{ width: idx < selectedStatusIndex ? '100%' : idx === selectedStatusIndex ? `${progress}%` : '0%' }}
                            />
                        </div>
                    ))}
                </div>

                {/* --- Top: Header --- */}
                <div className="absolute top-7 left-0 right-0 px-4 flex items-center justify-between z-60 bg-gradient-to-b from-black/70 to-transparent pb-10">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button onClick={() => onSetStatusUser(null)} className="text-white p-1 hover:bg-white/10 rounded-full shrink-0 transition-all active:scale-90">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
                            <AvatarImg src={selectedStatusUser.user?.avatar} username={selectedStatusUser.user?.username} size="w-full h-full" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h3 className="text-white font-semibold text-[15px] truncate">
                                {selectedStatusUser.user?.displayName || selectedStatusUser.user?.username}
                            </h3>
                            <p className="text-white/70 text-[11px]">
                                {safeCurrent?.createdAt ? new Date(safeCurrent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-white shrink-0">
                        {isOwner ? (
                            <button className="p-2 hover:bg-red-500/20 rounded-full" onClick={() => onDeleteStatus(safeCurrent._id)}>
                                <Trash2 size={20} className="text-red-400" />
                            </button>
                        ) : (
                            <button className="p-2 hover:bg-white/10 rounded-full" onClick={() => setIsMuted(!isMuted)}>
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                        )}
                        <button className="p-2 hover:bg-white/10 rounded-full"><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* --- Middle: Media Content --- */}
                <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
                    {safeCurrent?.fileType === 'video' ? (
                        <video
                            ref={videoRef}
                            key={safeCurrent.filePath}
                            src={`${API_BASE}${safeCurrent.filePath}`}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <img src={`${API_BASE}${safeCurrent.filePath}`} className="w-full h-full object-contain" alt="Status" />
                    )}

                    {/* Navigation Tap Overlay */}
                    <div className="absolute inset-0 flex">
                        <div className="w-[30%] h-full cursor-pointer touch-none" onClick={() => onSetStatusIndex(Math.max(0, selectedStatusIndex - 1))} />
                        <div className="flex-1 h-full cursor-pointer touch-none" onClick={() => handleNextStatus()} />
                    </div>
                </div>

                {/* --- Bottom: Caption and Controls --- */}
                <div className="absolute bottom-0 left-0 right-0 z-70 flex flex-col items-center w-full px-3 pb-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">

                    {/* Status Caption - Now at bottom */}
                    {safeCurrent.caption && (
                        <div className="w-full max-w-full mb-4 px-2">
                            <p className="text-white text-center text-[15px] leading-relaxed drop-shadow-lg break-words">
                                {safeCurrent.caption}
                            </p>
                        </div>
                    )}

                    {isOwner ? (
                        /* Views Pill */
                        <div className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2 mb-1 shadow-lg">
                                <Eye size={18} className="text-white" />
                                <span className="text-white font-semibold text-sm">{statusViewers?.length || 0}</span>
                            </div>
                            <span className="text-white/60 text-[10px] uppercase font-bold tracking-[0.1em]">Views</span>
                        </div>
                    ) : (
                        /* WhatsApp Style Reply Box - Mobile Optimized */
                        <div className="flex items-center gap-2 w-full max-w-full overflow-hidden">
                            <div className="flex-1 flex items-center gap-2 bg-[#2a2a2a] rounded-full px-3 py-1 shadow-lg border-none">
                                <button className="text-white/50 p-1 shrink-0">
                                    <Smile size={22} />
                                </button>
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => onSetReplyText(e.target.value)}
                                    placeholder="Reply"
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-white text-[16px] py-2.5 w-full placeholder:text-white/30 shadow-none"
                                />
                                <button className="text-white/50 p-1 shrink-0 rotate-45">
                                    <Plus size={22} />
                                </button>
                            </div>

                            <button
                                onClick={onSendReply}
                                disabled={!replyText.trim() || isSendingReply}
                                className={`p-3.5 rounded-full shrink-0 transition-all ${replyText.trim() ? 'bg-[#00a884] text-white scale-100' : 'bg-[#2a2a2a] text-white/30 scale-95'
                                    } shadow-md`}
                            >
                                {isSendingReply ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={20} fill={replyText.trim() ? "currentColor" : "none"} />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}