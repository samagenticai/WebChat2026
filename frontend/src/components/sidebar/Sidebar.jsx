import React from 'react';
import SidebarHeader from './SidebarHeader';
import SearchBar from '../../components/chat/SearchBar';
import ContactsList from '../../components/contacts/ContactsList';

export default function Sidebar({
  myProfile,
  showMenu,
  setShowMenu,
  menuRef,
  showSidebar,
  navigate,
  setShowAdd,
  logout,
  contactSearch,
  setContactSearch,
  contacts,
  activeContact,
  selectContact,
  isContactOnline,
  formatContactStatus,
  getLastMessageForContact,
  formatLastMessage,
  formatLastMessageTime,
  formatDuration,
  unreadCounts,
  typingUsers,
  userId,
  API_BASE,
  statusFeed,
  token,
  setContacts,
  getSavedContactName
}) {
  return (
    <aside
      className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:relative z-30 w-full sm:w-80 md:w-80 h-full min-w-0
        bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto
      `}
    >
      {/* Profile Header */}
      <SidebarHeader
        myProfile={myProfile}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        menuRef={menuRef}
        navigate={navigate}
        setShowAdd={setShowAdd}
        logout={logout}
      />

      {/* Search Bar */}
      <SearchBar contactSearch={contactSearch} setContactSearch={setContactSearch} />

      {/* Contacts List */}
      <ContactsList
        contacts={contacts}
        contactSearch={contactSearch}
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
        myProfile={myProfile}
        statusFeed={statusFeed}
        token={token}
        setContacts={setContacts}
        getSavedContactName={getSavedContactName}
      />
    </aside>
  );
}