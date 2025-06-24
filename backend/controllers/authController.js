import User from '../models/User.js';
import Startup from '../models/Startup.js';
import Department from '../models/Department.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user (Signup)
// @route   POST /api/auth/signup
// @access  Public
const signupUser = async (req, res) => {
  const { fullName, email, password, role, affiliationType, affiliationName } = req.body;

  // Basic validation
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User with this email already exists.' });
  }
  
  // Create the user object
  const user = new User({
    fullName,
    email,
    password, // Password will be hashed by the pre-save hook in the User model
    role,
  });

  // Handle affiliation
  if (affiliationType && affiliationName) {
    if (affiliationType === 'startup') {
      let startup = await Startup.findOne({ name: affiliationName });
      // For simplicity, let's create the startup if it doesn't exist.
      // In a real app, you might want this to be a pre-populated list.
      if (!startup) {
        startup = await Startup.create({ name: affiliationName, description: 'Auto-generated description' });
      }
      user.startup = startup._id;
    } else if (affiliationType === 'department') {
      let department = await Department.findOne({ name: affiliationName });
      if (!department) {
        department = await Department.create({ name: affiliationName, description: 'Auto-generated description' });
      }
      user.department = department._id;
    }
  }

  await user.save();

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data.' });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password.' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
  // The 'jwt' here must match the name of the cookie we set in generateToken
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0), // Set to a past date to expire it immediately
  });
  res.status(200).json({ message: 'Logged out successfully' });
};


// We will add forgot/reset password later.
// For now, let's export these functions.
export { signupUser, loginUser, logoutUser };