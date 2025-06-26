import User from '../models/User.js';
import Startup from '../models/Startup.js';
import Department from '../models/Department.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user (Signup)
// @route   POST /api/auth/signup
// @access  Public
const signupUser = async (req, res) => {
  try {
    const { fullName, email, password, role, assignedDepartment } = req.body;

    // Enhanced validation
    if (!fullName || !email || !password || !role || !assignedDepartment) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields, including department.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Verify the department exists
    const departmentExists = await Department.findById(assignedDepartment);
    if (!departmentExists) {
      return res.status(400).json({ success: false, message: 'Invalid department selected.' });
    }

    // Create the user
    const user = await User.create({
      fullName,
      email,
      password, // Hashed by pre-save hook
      role,
      assignedDepartment, // Use the new, correct field
    });

    // Generate token and send response
    generateToken(res, user._id);

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      assignedDepartment: user.assignedDepartment,
      avatarUrl: user.avatarUrl,
    };

    res.status(201).json({ success: true, user: userResponse });

  } catch (error) {
    console.error('ERROR in signupUser:', {
      message: error.message,
      stack: error.stack,
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error during signup.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email }).select('+password +isActive');
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    console.log('User found, checking password...');
    const isMatch = await user.correctPassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.error('Invalid password for email:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if the user's account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }
    
    // Generate and set JWT token in HTTP-only cookie
    generateToken(res, user._id);

    // Update the last login timestamp without triggering validation
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Return user data (excluding password)
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      startup: user.startup,
      department: user.department,
      avatarUrl: user.avatarUrl, // Include virtual property
    };

    res.status(200).json({ success: true, user: userResponse });
  } catch (error) {
    console.error('ERROR in loginUser:', {
      message: error.message,
      stack: error.stack,
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
  try {
    console.log('Logout request received');
    
    // Clear the JWT cookie by setting it to empty and expiring it
    res.cookie('jwt', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict',
      expires: new Date(0),
    });

    console.log('User logged out successfully');
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    console.error('ERROR in logoutUser:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      message: 'Error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// We will add forgot/reset password later.
// For now, let's export these functions.
export { signupUser, loginUser, logoutUser };