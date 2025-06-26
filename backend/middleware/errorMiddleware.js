// Middleware to handle requests for routes that don't exist.
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  console.error('404 Not Found:', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    error: 'The requested resource was not found',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
};

// Middleware to handle all other errors, including those passed from other middleware.
const errorHandler = (err, req, res, next) => {
  // Log the error with request details
  console.error('Error Handler:', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err.code && { code: err.code }),
      ...(err.keyValue && { keyValue: err.keyValue })
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body
    },
    timestamp: new Date().toISOString()
  });

  // Default status code to 500 if not set
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errorDetails = {};

  // Handle different types of errors
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
    errorDetails = { resource: 'Invalid ID format' };
  } 
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    message = 'Validation failed';
    errorDetails = { validation: errors };
  }
  // Handle duplicate key errors
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    errorDetails = { duplicate: err.keyValue };
  }

  // Send the error response
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(Object.keys(errorDetails).length > 0 && { details: errorDetails }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      type: err.name
    })
  });
};

export { notFound, errorHandler };
