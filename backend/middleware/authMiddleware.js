import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Read the JWT from the 'jwt' cookie
    token = req.cookies.jwt;

    if (token) {
      try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user by the ID from the token's payload
        // .select('-password') excludes the password field from the returned user object
        req.user = await User.findById(decoded.userId).select('-password');

        // If the user is not found, it means the token is valid but the user doesn't exist
        if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // If the user is found, proceed to the next middleware or the route handler
        next();
      } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Not authorized, token failed' });
      }
    } else {
      // If no token is found, the user is not authorized
      res.status(401).json({ message: 'Not authorized, no token' });
    }
  } catch (error) {
    console.error('CRITICAL ERROR IN PROTECT MIDDLEWARE:', error);
    res.status(500).json({
      message: 'Critical server error in authentication middleware.',
      error: error.message,
    });
  }
};

export { protect };