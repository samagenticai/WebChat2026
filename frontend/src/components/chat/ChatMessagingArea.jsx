import React from 'react';
import ChatArea from './ChatArea';
import EmptyState from '../../utils/EmptyState';

export default function ChatMessagingArea({
  activeContact,
  myProfile,
  isContactOnline,
  typingUsers,
  setShowSidebar,
  handleOpenUserDetails,
  getContactStatusWithDateTime,
  messages,
  setMessages,
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
  showUserDetails,
  showEditUser,
  replyingTo,
  setReplyingTo,
  selectedMessages,
  setSelectedMessages,
  isSelectionMode,
  setIsSelectionMode,
  pinnedMessages,
  setPinnedMessages,
  contacts,
  onSaveContact,
  isSavedContact,
  getSavedContactName,
}) {

  return (
    <main className="flex-1 flex flex-col h-full bg-[#f0f2f5] relative min-w-0 overflow-hidden">
      {/* Chat Area Container */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden bg-white">
        {/* 1. Top Border/Shadow for subtle depth */}
        <div className="absolute top-0 left-0 right-0 h-px bg-slate-200/50 z-30" />
        {activeContact ? (
          <ChatArea
            activeContact={activeContact}
            myProfile={myProfile}
            isContactOnline={isContactOnline}
            typingUsers={typingUsers}
            setShowSidebar={setShowSidebar}
            handleOpenUserDetails={handleOpenUserDetails}
            getContactStatusWithDateTime={getContactStatusWithDateTime}
            messages={messages}
            setMessages={setMessages}
            onLocalDelete={onLocalDelete}
            userId={userId}
            scrollRef={scrollRef}
            API_BASE={API_BASE}
            showUserDetails={showUserDetails}
            wallpaperUrl={wallpaperUrl}
            onChangeWallpaper={onChangeWallpaper}
            groupSubtitle={groupSubtitle}
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
            token={token}
            onImageClick={onImageClick}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            selectedMessages={selectedMessages}
            setSelectedMessages={setSelectedMessages}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            pinnedMessages={pinnedMessages}
            setPinnedMessages={setPinnedMessages}
            contacts={contacts}
            onSaveContact={onSaveContact}
            isSavedContact={isSavedContact}
            getSavedContactName={getSavedContactName}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Internal Style for smooth transitions */}
      <style>{`
        main {
          /* Backdrop pattern for the outer area */
          background-image: radial-gradient(#e2e8f0 0.5px, transparent 0.5px);
          background-size: 20px 20px;
        }
      `}</style>
    </main>
  );
}