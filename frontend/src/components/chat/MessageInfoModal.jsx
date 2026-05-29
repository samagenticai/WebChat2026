import React from 'react';
import { X, Check, CheckCheck, User } from 'lucide-react';

export default function MessageInfoModal({ visible, data, API_BASE, onClose, currentUserId }) {
  if (!visible || !data) return null;

  // Check if the message was sent by the current user
  const isMine = data.sender?._id === currentUserId || data.sender === currentUserId;

  const getStatusInfo = () => {
    if (data.read) return { label: 'Read', color: '#34b7f1', icon: <CheckCheck size={16} color="#34b7f1" /> };
    if (data.delivered) return { label: 'Delivered', color: '#8696a0', icon: <CheckCheck size={16} color="#8696a0" /> };
    return { label: 'Sent', color: '#8696a0', icon: <Check size={16} color="#8696a0" /> };
  };

  const status = getStatusInfo();

  return (
    <>
      <div 
        style={{
          position: 'fixed', inset: 0, background: 'rgba(11, 20, 26, 0.85)', 
          zIndex: 10000, backdropFilter: 'blur(2px)'
        }} 
        onClick={onClose} 
      />

      <div className="whatsapp-modal" style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        background: '#f0f2f5', width: '95%', maxWidth: '400px', zIndex: 10001,
        borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{ background: '#008069', color: 'white', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
            <X size={22} />
          </button>
          <span style={{ fontSize: '17px', fontWeight: 500 }}>Message info</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          
          {/* Message Preview Section - Chat Like Background */}
          <div style={{ 
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', // Subtle WhatsApp pattern
            backgroundColor: '#e5ddd5',
            padding: '25px 15px', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {/* The "Small" Compact Message Box */}
            <div style={{ 
              background: isMine ? '#d9fdd3' : 'white', 
              padding: '6px 10px 4px 10px', 
              borderRadius: '8px', 
              boxShadow: '0 1px 1px rgba(0,0,0,0.15)',
              maxWidth: '85%', 
              minWidth: '80px',
              alignSelf: isMine ? 'flex-end' : 'flex-start', // Position based on sender
              position: 'relative'
            }}>
              {data.text && <p style={{ margin: 0, fontSize: '14.5px', color: '#111b21', lineHeight: '1.4' }}>{data.text}</p>}
              
              {data.image?.path && (
                <div style={{ marginBottom: 4, borderRadius: 4, overflow: 'hidden' }}>
                   <img src={`${API_BASE}${data.image.path}`} alt="msg" style={{ maxWidth: '100%', display: 'block' }} />
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-end', 
                gap: '4px', 
                marginTop: '2px' 
              }}>
                <span style={{ fontSize: '11px', color: '#667781' }}>
                  {new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMine && status.icon}
              </div>
            </div>
          </div>

          {/* Details List */}
          <div style={{ background: 'white', marginTop: '10px' }}>
            <div style={rowStyle}>
              <div style={iconContainer}><CheckCheck size={18} color="#34b7f1" /></div>
              <div style={infoContainer}>
                <div style={labelStyle}>Read</div>
                <div style={timeStyle}>{data.readAt ? new Date(data.readAt).toLocaleString() : '---'}</div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={iconContainer}><CheckCheck size={18} color="#8696a0" /></div>
              <div style={infoContainer}>
                <div style={labelStyle}>Delivered</div>
                <div style={timeStyle}>{data.deliveredAt ? new Date(data.deliveredAt).toLocaleString() : new Date(data.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <div style={iconContainer}><User size={18} color="#8696a0" /></div>
              <div style={infoContainer}>
                <div style={labelStyle}>Details</div>
                <div style={timeStyle}>From: {data.sender?.username || 'You'}</div>
                <div style={timeStyle}>To: {data.recipient?.username || 'Recipient'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .whatsapp-modal { animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -45%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        @media (max-width: 480px) {
          .whatsapp-modal { width: 100% !important; height: 100% !important; max-height: 100vh !important; border-radius: 0 !important; }
        }
      `}</style>
    </>
  );
}

const rowStyle = { display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px dotted #e9edef' };
const iconContainer = { width: '45px' };
const infoContainer = { flex: 1 };
const labelStyle = { fontSize: '16px', color: '#111b21' };
const timeStyle = { fontSize: '13px', color: '#667781', marginTop: '1px' };