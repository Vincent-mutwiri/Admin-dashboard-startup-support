// Middleware to handle requests for routes that don't exist.
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware to handle all other errors, including those passed from other middleware.
const errorHandler = (err, req, res, next) => {
  // Sometimes an error might come in with a 200 status code, so we want to default to 500 if that's the case.
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose throws a 'CastError' for malformed ObjectIDs. We can catch that here.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Send a structured JSON error response.
  // In a production environment, we would not send the stack trace.
  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
