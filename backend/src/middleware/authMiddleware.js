const { verifyToken } = require('../utils/tokenManager');
const { sendError } = require('../utils/responseHandler');

/**
 * Middleware to protect routes - requires valid JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found
    if (!token) {
      return sendError(res, 'Not authorized. Please login.', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return sendError(res, 'Invalid or expired token. Please login again.', 401);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  protect,
  optionalAuth
};