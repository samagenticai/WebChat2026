const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function authMiddleware(req, res, next){
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = h.slice(7);
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = String(payload.id);
    next();
  }catch(err){ res.status(401).json({ error: 'Invalid token' }); }
}

module.exports = authMiddleware;
