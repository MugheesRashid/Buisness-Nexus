const jwt = require('jsonwebtoken');
const Entrepreneur = require('../models/Entrepreneur');
const Investor = require('../models/Investor');

const auth = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    let user = null;
    
    // Find user based on role
    if (decoded.role === 'entrepreneur') {
      user = await Entrepreneur.findById(decoded.id);
    } else if (decoded.role === 'investor') {
      user = await Investor.findById(decoded.id);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
        
    // Attach user to request
    req.user = user;
    req.user.role = decoded.role; // Add role to user object
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth;