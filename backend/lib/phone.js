function normalizePhone(raw){
  if (!raw) return '';
  let s = String(raw).trim();
  s = s.replace(/[^0-9+]/g,'');
  // if starts with 0 and looks like local Pakistani number, prefix +92
  if (/^0[3-9][0-9]{8}$/.test(s)) return '+92' + s.slice(1);
  // if 10 digits without leading 0 (e.g. 3001234567) treat as +92
  if (/^[2-9][0-9]{9}$/.test(s)) return '+92' + s;
  // already in E.164 or has +
  if (/^\+\d{8,15}$/.test(s)) return s;
  // fallback: return digits-only
  return s.replace(/[^0-9]/g,'');
}

module.exports = { normalizePhone };
