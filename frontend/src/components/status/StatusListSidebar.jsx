import React from 'react';
import { Plus, ArrowLeft, MoreVertical, Eye, Camera } from 'lucide-react';
import AvatarImg from '../user/AvatarImg';
import StatusAvatarCard from './StatusAvatarCard';

export default function StatusListSidebar({
    myProfile,
    myStatuses,
    statusGroups,
    selectedStatusUser,
    onAddStatus,
    onSelectStatus,
    onOpenManageModal,
    onManageStatus,
    fileInputRef,
    onHandleFileSelect,
    navigate,
    API_BASE,
    deleteStatus,
    myProfileRef
}) {
    const totalViews = myStatuses.reduce((acc, s) => acc + (s.viewers?.length || 0), 0);

    return (
        <>
            {/* LEFT SIDEBAR CONTAINER */}
            <div className={`w-full md:w-[400px] border-r border-[#d1d7db] flex flex-col bg-white shrink-0 transition-all duration-300 ${selectedStatusUser ? 'hidden md:flex' : 'flex'}`}>
                
                {/* WhatsApp Web Style Header */}
                <div className="h-[118px] bg-[#00a884] flex flex-col justify-end pb-3 px-5 transition-all">
                    <div className="flex items-center gap-6 mb-1">
                         <button onClick={() => navigate('/chat')} className="text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-[19px] font-medium text-white tracking-wide">Status</h2>
                    </div>
                </div>

                {/* LIST CONTENT */}
                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar select-none">
                    
                    {/* MY STATUS SECTION */}
                    <div
                        className="flex items-center gap-4 px-4 py-[14px] hover:bg-[#f5f6f6] cursor-pointer transition-colors group"
                        onClick={() => {
                            if (myStatuses?.length > 0 && myProfile) {
                                onSelectStatus({ user: myProfile, statuses: myStatuses }, 0);
                            } else {
                                onAddStatus();
                            }
                        }}
                    >
                        <div className="relative flex-shrink-0">
                            {/* Profile Image with Ring Effect if status exists */}
                            <div className={`w-[52px] h-[52px] rounded-full p-[2px] ${myStatuses?.length > 0 ? 'border-2 border-[#00a884]' : 'border border-gray-100'}`}>
                                <div className="w-full h-full rounded-full overflow-hidden">
                                    <AvatarImg src={myProfile?.avatar} username={myProfile?.username} size="w-full h-full object-cover" />
                                </div>
                            </div>
                            
                            {/* Plus Icon - Only show if no status or as an overlay */}
                            <div className="absolute bottom-0 right-0 bg-[#00a884] text-white rounded-full p-1 border-2 border-white shadow-sm translate-x-1 translate-y-1">
                                {myStatuses?.length > 0 ? <Camera size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={4} />}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-normal text-[#111b21] text-[17px]">My status</h4>
                            <p className="text-[14px] text-[#667781] truncate">
                                {myStatuses.length > 0 ? (
                                    <span className="flex items-center gap-2">
                                        Recently updated
                                        {totalViews > 0 && (
                                            <span className="flex items-center gap-1 text-[#00a884] font-medium">
                                                <Eye size={14} /> {totalViews}
                                            </span>
                                        )}
                                    </span>
                                ) : 'Click to add status update'}
                            </p>
                        </div>
                    </div>

                    {/* SECTION DIVIDER */}
                    <div className="h-[72px] flex items-center px-4 text-[15px] text-[#008069] bg-white">
                        RECENT
                    </div>

                    {/* STATUS CARDS LIST */}
                    <div className="pb-4">
                        {statusGroups
                            .filter(group => !(myProfile && String(group.user._id) === String(myProfile._id)))
                            .map((group) => {
                                const isSelected = selectedStatusUser && String(selectedStatusUser.user._id) === String(group.user._id);
                                
                                return (
                                    <StatusAvatarCard
                                        key={group.user._id}
                                        user={group.user}
                                        statusCount={group.statuses.length}
                                        isSelected={isSelected}
                                        onSelect={() => onSelectStatus(group, 0)}
                                        API_BASE={API_BASE}
                                        latestStatusTime={group.statuses[0]?.createdAt}
                                        isNew={true} 
                                    />
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* MANAGE MODAL */}
            {myProfileRef?.showManageModal && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white shadow-2xl rounded-lg w-full max-w-md overflow-hidden border border-gray-100">
                        {/* Logic handled by your existing modal code */}
                    </div>
                 </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={onHandleFileSelect} className="hidden" />
        </>
    );
}