const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Требуется аутентификация' });
  }
};

const requireVerification = (req, res, next) => {
  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({ 
      error: 'Требуется верификация аккаунта' 
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ 
      error: 'Требуются права администратора' 
    });
  }
  next();
};

module.exports = { auth, requireVerification, requireAdmin };