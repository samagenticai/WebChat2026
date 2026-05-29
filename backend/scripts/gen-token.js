const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Use Fahad's user ID from the database
const userId = '67a0b900670bb8769c574393';

const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
console.log('Valid Token:', token);
console.log('\nUse this token in API tests or save to session');
