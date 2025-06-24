// This function takes an array of allowed roles
const permit = (...allowedRoles) => {
    // It returns a middleware function
    return (req, res, next) => {
      // We assume the 'protect' middleware has already run and attached the user to the request
      if (req.user && allowedRoles.includes(req.user.role)) {
        // If the user's role is in the allowed list, proceed
        next();
      } else {
        // Otherwise, send a 403 Forbidden error
        res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
      }
    };
  };
  
  export { permit };