const jwt = require('jsonwebtoken');
const config = require('../config/env');

const isAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });
  
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = { isAuth, isAdmin };