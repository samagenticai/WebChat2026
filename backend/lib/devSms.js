const messages = [];

function push(msg){
  const id = Date.now() + '-' + Math.random().toString(36).slice(2);
  const rec = { id, ...msg, createdAt: new Date() };
  messages.unshift(rec);
  // keep recent 200
  if (messages.length > 200) messages.length = 200;
  return rec;
}

function list(filter){
  if (!filter) return messages;
  return messages.filter(m => {
    if (filter.to && m.to !== filter.to) return false;
    return true;
  });
}

module.exports = { push, list };
