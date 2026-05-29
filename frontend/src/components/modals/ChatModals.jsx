import React, { useState } from 'react';
import SettingsModal from './SettingsModal';
import ImageViewer from '../../utils/ImageViewer';
import AddContactModal from '../contacts/AddContactModal';
import UserDetailsPanel from '../user/UserDetailsPanel';
import MobileOverlay from '../../utils/MobileOverlay';
import SaveContactModal from './SaveContactModal';

import EditUserPanel from '../user/EditUserPanel';

export default function ChatModals({
  showSettings,
  setShowSettings,
  userId,
  apiBase,
  showImageViewer,
  handleCloseImageViewer,
  viewingImageUrl,
  selectedUserForDetails,
  showUserDetails,
  handleCloseUserDetails,
  loadingUserDetails,
  handleViewPhoto,
  showAdd,
  setShowAdd,
  addContact,
  newIdentifier,
  setNewIdentifier,
  displayNameInput,
  setDisplayNameInput,
  addMsg,
  showSidebar,
  setShowSidebar,
  isDesktop,
  token,
  setMyProfile,
  setSelectedUserForDetails,
  setShowUserDetails,
  onContactFriendlyNameUpdated,
  showEditUser,
  setShowEditUser,
  userMessagesForDetails = [],
  showSaveContact,
  setShowSaveContact,
  contactToSave,
  onSaveContactSuccess,
  getSavedContactName,
}) {
  // `showEditUser` is lifted to the parent `ChatPage` so layout can respond.
  return (
    <>
      {/* 1. Mobile Overlay - Sabse peeche (Lower layer) */}
      <MobileOverlay
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        isDesktop={isDesktop}
      />

      {/* 2. User Details Panel Modal - Overlay on mobile, Side panel on desktop */}
      {showUserDetails && (
        <>
          {/* Mobile: overlay */}
          {!isDesktop && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={handleCloseUserDetails}
              />
              <div className={`fixed z-50 bg-white inset-0`}>
                <UserDetailsPanel
                  isOpen={showUserDetails}
                  onClose={handleCloseUserDetails}
                  user={{ ...selectedUserForDetails, displayName: getSavedContactName ? getSavedContactName(selectedUserForDetails) : (selectedUserForDetails?.displayName || selectedUserForDetails?.username), messages: userMessagesForDetails }}
                  onPhotoClick={() => selectedUserForDetails?.avatar && handleViewPhoto(selectedUserForDetails.avatar)}
                  onMediaClick={(url) => handleViewPhoto(url)}
                  isLoading={loadingUserDetails}
                  token={token}
                  apiBase={apiBase}
                  onEdit={() => { handleCloseUserDetails(true); setShowEditUser(true); }}
                />
              </div>
            </>
          )}

          {/* Desktop: inline right panel placed by parent grid */}
          {isDesktop && (
            <div className="hidden md:block relative z-20 w-96 border-l border-slate-200 bg-white">
              <UserDetailsPanel
                isOpen={showUserDetails}
                onClose={handleCloseUserDetails}
                user={{ ...selectedUserForDetails, displayName: getSavedContactName ? getSavedContactName(selectedUserForDetails) : (selectedUserForDetails?.displayName || selectedUserForDetails?.username), messages: userMessagesForDetails }}
                onPhotoClick={() => selectedUserForDetails?.avatar && handleViewPhoto(selectedUserForDetails.avatar)}
                onMediaClick={(url) => handleViewPhoto(url)}
                isLoading={loadingUserDetails}
                token={token}
                apiBase={apiBase}
                onEdit={() => { handleCloseUserDetails(true); setShowEditUser(true); }}
              />
            </div>
          )}
        </>
      )}

        {/* Edit Profile Panel */}
        {showEditUser && (
          <>
            {!isDesktop && (
              <>
                <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => { setShowEditUser(false); }} />
                <div className={`fixed z-50 bg-white inset-0`}>
                  <EditUserPanel
                    isOpen={showEditUser}
                    onClose={() => setShowEditUser(false)}
                    apiBase={apiBase}
                    token={token}
                    user={selectedUserForDetails}
                    currentUserId={userId}
                    onSaved={(updated) => {
                      if (String(updated._id) === String(userId)) setMyProfile && setMyProfile(updated);
                      setSelectedUserForDetails && setSelectedUserForDetails(updated);
                      onContactFriendlyNameUpdated && onContactFriendlyNameUpdated(updated);
                      setShowEditUser(false);
                      setShowUserDetails && setShowUserDetails(true);
                    }}
                  />
                </div>
              </>
            )}

            {isDesktop && (
              <div className="hidden md:block relative z-20 w-96 border-l border-slate-200 bg-white">
                <EditUserPanel
                  isOpen={showEditUser}
                  onClose={() => setShowEditUser(false)}
                  apiBase={apiBase}
                  token={token}
                  user={selectedUserForDetails}
                  currentUserId={userId}
                  onSaved={(updated) => {
                    if (String(updated._id) === String(userId)) setMyProfile && setMyProfile(updated);
                    setSelectedUserForDetails && setSelectedUserForDetails(updated);
                    onContactFriendlyNameUpdated && onContactFriendlyNameUpdated(updated);
                    setShowEditUser(false);
                    setShowUserDetails && setShowUserDetails(true);
                  }}
                />
              </div>
            )}
          </>
        )}

      {/* 3. Settings Modal - Center Popup */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={userId}
        apiBase={apiBase}
      />

      {/* Save Contact Modal - Center Popup */}
      <SaveContactModal
        isOpen={showSaveContact}
        onClose={() => setShowSaveContact(false)}
        contact={contactToSave}
        apiBase={apiBase}
        token={token}
        userId={userId}
        onSave={onSaveContactSuccess}
      />

      {/* 4. Add Contact Modal - Center Popup */}
      <AddContactModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAddContact={addContact}
        identifier={newIdentifier}
        setIdentifier={setNewIdentifier}
        displayName={displayNameInput}
        setDisplayName={setDisplayNameInput}
        message={addMsg}
        isLoading={false}
      />

      {/* 5. Full Screen Image Viewer - Highest Z-Index (Top Layer) */}
      {showImageViewer && (
        <div className="fixed inset-0 z-100 animate-in fade-in duration-200">
          <ImageViewer
            isOpen={showImageViewer}
            onClose={handleCloseImageViewer}
            imageUrl={viewingImageUrl}
            userName={selectedUserForDetails?.displayName || selectedUserForDetails?.username}
          />
        </div>
      )}

      {/* Global CSS for Professional Modals */}
      <style>{`
        .modal-enter { opacity: 0; transform: scale(0.95); }
        .modal-enter-active { opacity: 1; transform: scale(1); transition: all 300ms ease-out; }

        /* Glassmorphism for Modal Backdrops */
        .modal-backdrop {
          backdrop-filter: blur(4px);
          background-color: rgba(15, 23, 42, 0.4);
        }
      `}</style>
    </>
  );
}