const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Authentication middleware to verify JWT token
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-passwordHash');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but admin account is inactive.'
        });
      }
    } else {
      user = await User.findById(decoded.id).select('-passwordHash');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user account is inactive.'
        });
      }
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      userData: user
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication.'
      });
    }
  }
};

/**
 * Optional authentication middleware - continues even if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user info
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-passwordHash');
    } else {
      user = await User.findById(decoded.id).select('-passwordHash');
    }

    if (user && user.isActive) {
      req.user = {
        id: decoded.id,
        role: decoded.role,
        userData: user
      };
    }

    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
};

/**
 * Agent authentication middleware
 */
const agentAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'agent') {
      return res.status(403).json({ success: false, message: 'Access denied. Not an agent.' });
    }
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  agentAuth
};
