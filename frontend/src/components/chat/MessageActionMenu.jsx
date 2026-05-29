import React, { useEffect, useState } from 'react';
import { Reply, Forward, Pin, Trash2, Copy, Info } from 'lucide-react';

export default function MessageActionMenu({
  visible,
  anchor,
  messageText,
  isSender, // Agar yeh mile toh accha hai, nahi toh hum automatic check kar lenge
  onDelete,
  onReply,
  onForward,
  onPin,
  onCopy,
  onInfo,   
  onClose
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) setShow(true);
    else {
      const t = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  /* ===== AUTOMATIC & SMART POSITIONING LOGIC ===== */
  const menuWidth = 200;
  const menuHeight = 250;
  const margin = 16;
  const navbarHeight = 70; // top safe area
  const inputBarMinHeight = 90; // account for input area (90-110 recommended)
  const inputBarSafe = inputBarMinHeight + 10;

  // Derive coordinates from anchor (support rect or x/y)
  const rect = anchor && anchor.rect ? anchor.rect : null;
  const rawX = typeof anchor?.x === 'number' ? anchor.x : (rect ? (rect.left + rect.right) / 2 : null);
  const rawY = typeof anchor?.y === 'number' ? anchor.y : (rect ? (rect.top + rect.bottom) / 2 : null);

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // Failsafe detection: if parent didn't pass isSender, infer from coords
  let inferredSender = false;
  if (typeof isSender === 'boolean') {
    inferredSender = isSender;
  } else if (rect) {
    inferredSender = (rect.left + rect.width / 2) > (viewportW / 2);
  } else if (rawX !== null) {
    inferredSender = rawX > (viewportW / 2);
  } else {
    inferredSender = false;
  }

  // If click coords are missing or obviously relative (e.g., > viewport), fallback to rect center
  const clickX = (rawX === null || rawX > viewportW + 200) ? (rect ? (rect.left + rect.right) / 2 : Math.round(viewportW / 2)) : rawX;
  const clickY = (rawY === null || rawY > viewportH + 200) ? (rect ? (rect.top + rect.bottom) / 2 : Math.round(viewportH / 2)) : rawY;

  // Horizontal: open left for sender, right for receiver
  let left;
  if (rect) {
    if (inferredSender) left = rect.left - menuWidth - 12; else left = rect.right + 12;
  } else {
    if (inferredSender) left = clickX - menuWidth - 12; else left = clickX + 12;
  }

  // Vertical: prefer centering vertically around message mid; flip upwards if too close to bottom input area
  const allowedBottom = viewportH - inputBarSafe - margin;
  let top = (clickY || viewportH / 2) - Math.round(menuHeight / 2);

  // If menu would overflow bottom (considering input bar), flip up
  if (top + menuHeight > allowedBottom) {
    top = (clickY || viewportH / 2) - menuHeight - 12; // render above
  }

  // If still too high (off top), clamp to navbar
  if (top < navbarHeight + margin) top = navbarHeight + margin;

  // Strict hard boundary clamp horizontally and vertically
  left = Math.max(margin, Math.min(left, viewportW - menuWidth - margin));
  top = Math.max(margin + navbarHeight, Math.min(top, viewportH - menuHeight - margin - inputBarSafe));

  // Arrow/caret calculation: position relative to menu
  let arrow = null;
  if (rect) {
    const midY = rect.top + (rect.height / 2);
    let arrowTop = Math.round(midY - top) - 8; // 8px half arrow offset
    arrowTop = Math.max(10, Math.min(arrowTop, menuHeight - 20));
    if (inferredSender) arrow = { side: 'right', top: arrowTop };
    else arrow = { side: 'left', top: arrowTop };
  } else {
    // Use clickY as fallback
    let arrowTop = Math.round((clickY || viewportH / 2) - top) - 8;
    arrowTop = Math.max(10, Math.min(arrowTop, menuHeight - 20));
    arrow = { side: inferredSender ? 'right' : 'left', top: arrowTop };
  }

  const styles = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      backgroundColor: 'transparent',
    },
    menu: {
      position: 'fixed',
      left,
      top,
      width: menuWidth,
      height: menuHeight,
      backgroundColor: 'rgba(255,255,255,0.98)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
      padding: '6px',
      zIndex: 10001,
      transition: 'opacity 0.18s ease, transform 0.18s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.98)',
      transformOrigin: inferredSender ? 'right center' : 'left center',
      overflow: 'hidden',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      cursor: 'pointer',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
    }
  };

  const menuItems = [
    { label: 'Reply', icon: <Reply size={18} />, onClick: onReply },
    { label: 'Forward', icon: <Forward size={18} />, onClick: onForward },
    { label: 'Pin Message', icon: <Pin size={18} />, onClick: onPin },
    ...(onInfo ? [{ label: 'Message Info', icon: <Info size={18} />, onClick: onInfo }] : []),
    {
      label: 'Copy Text',
      icon: <Copy size={18} />,
      onClick: () => onCopy ? onCopy(messageText) : navigator.clipboard.writeText(messageText)
    },
    { label: 'Delete', icon: <Trash2 size={18} />, onClick: onDelete, danger: true },
  ];

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div style={styles.menu} role="menu">
        {/* Arrow / Caret */}
        {arrow && (
          <div style={{ position: 'absolute', top: arrow.top, zIndex: 10002, pointerEvents: 'none', left: arrow.side === 'left' ? -10 : 'auto', right: arrow.side === 'right' ? -10 : 'auto' }}>
            {arrow.side === 'left' ? (
              <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid rgba(255,255,255,0.98)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }} />
            ) : (
              <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '10px solid rgba(255,255,255,0.98)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }} />
            )}
          </div>
        )}

        {menuItems.map((item, index) => (
          <div
            key={index}
            style={{ ...styles.item, color: item.danger ? '#EF4444' : '#374151' }}
            onClick={() => { item.onClick?.(); onClose(); }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = item.danger ? '#FEF2F2' : '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ opacity: 0.7, display: 'flex' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
    </> 
  );
}