import asyncHandler from 'express-async-handler';

// @desc    Test database connection
// @route   GET /api/test
// @access  Public
export const testDatabase = asyncHandler(async (req, res) => {
  try {
    // Try a simple query to test connection
    const count = await req.db.collection('departments').countDocuments();
    res.status(200).json({
      message: 'Database connection successful',
      departmentCount: count
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});
