const authService = require('../services/authService');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Authorization failed'
    });
  }
};

// Boat owner authorization middleware
const requireBoatOwner = async (req, res, next) => {
  try {
    const { boatNumber } = req.params;
    
    if (!req.user || req.user.boatNumber !== boatNumber) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this boat data'
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Authorization failed'
    });
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await authService.verifyToken(token);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireBoatOwner,
  optionalAuth
}; 