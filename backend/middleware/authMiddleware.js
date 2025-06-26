import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    console.log('Auth Middleware - Request received:', {
      method: req.method,
      url: req.originalUrl,
      cookies: req.cookies,
      headers: {
        'authorization': req.headers.authorization ? 'present' : 'missing',
        'cookie': req.headers.cookie ? 'present' : 'missing'
      }
    });

    let token;

    // 1. Check for token in Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header');
    } 
    // 2. Check for token in cookies
    else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
      console.log('Token found in cookies');
    }

    if (!token) {
      console.error('No token found in request');
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, no token provided',
        error: 'Missing authentication token'
      });
    }

    try {
      // Verify the token using the secret key
      console.log('Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded.userId) {
        console.error('Token is missing userId in payload:', decoded);
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          error: 'Token payload is missing userId'
        });
      }

      // Find the user by the ID from the token's payload
      console.log('Looking up user with ID:', decoded.userId);
      const user = await User.findById(decoded.userId).select('-password').lean();

      if (!user) {
        console.error('User not found for token with userId:', decoded.userId);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
          error: 'User account not found'
        });
      }

      // Attach user to request object
      req.user = user;
      console.log('User authenticated successfully:', { userId: user._id, email: user.email });
      
      // Proceed to the next middleware/route handler
      next();
    } catch (error) {
      console.error('Token verification failed:', {
        name: error.name,
        message: error.message,
        ...(error.expiredAt && { expiredAt: error.expiredAt }),
        ...(error.name === 'JsonWebTokenError' && { reason: 'Invalid token' })
      });

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired',
          error: 'Your session has expired. Please log in again.'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: 'The authentication token is invalid.'
        });
      }

      // For any other JWT errors
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'Failed to authenticate token'
      });
    }
  } catch (error) {
    console.error('CRITICAL ERROR IN AUTH MIDDLEWARE:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An error occurred during authentication',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Role-based access control middleware
const permit = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user' });
    }

    const hasPermission = allowedRoles.includes(req.user.role);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to perform this action',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

export { protect, permit };