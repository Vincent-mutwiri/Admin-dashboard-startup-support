import User from '../models/User.js';
import Department from '../models/Department.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @route   GET /api/users/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // The 'protect' middleware already attaches the user object.
    // We just need to re-fetch it to populate related fields.
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('startup', 'name description')
      .populate('department', 'name description') // Populate legacy field
      .populate('assignedDepartment', 'name description') // Populate new field
      .lean(); // Use .lean() for faster, plain JS objects

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Consolidate department information for a consistent response
    const departmentInfo = user.assignedDepartment || user.department;

    const userProfile = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      startup: user.startup,
      assignedDepartment: departmentInfo, // Return one consistent field
      avatarUrl: user.avatarUrl, // Include virtuals
      lastLogin: user.lastLogin,
    };

    res.status(200).json({ success: true, data: userProfile });

  } catch (error) {
    console.error('ERROR in getUserProfile:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        startup: updatedUser.startup,
        assignedDepartment: updatedUser.assignedDepartment,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('startup', 'name')
      .populate('assignedDepartment', 'name');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // If user is a department head, remove them from that role
      if (user.assignedDepartment) {
        await Department.updateOne(
          { _id: user.assignedDepartment, head: user._id },
          { $unset: { head: '' } }
        );
      }
      
      // Remove user from any department's members array
      await Department.updateMany(
        { members: user._id },
        { $pull: { members: user._id } }
      );

      await User.deleteOne({ _id: user._id });
      res.status(200).json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('startup', 'name')
      .populate('assignedDepartment', 'name');

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.startup = req.body.startup || user.startup;
      
      // Handle department assignment
      const oldDepartmentId = user.assignedDepartment?.toString();
      const newDepartmentId = req.body.assignedDepartment;
      
      if (oldDepartmentId !== newDepartmentId) {
        // Remove from old department's members array
        if (oldDepartmentId) {
          await Department.findByIdAndUpdate(
            oldDepartmentId,
            { $pull: { members: user._id } }
          );
        }
        
        // Add to new department's members array if new department is provided
        if (newDepartmentId) {
          await Department.findByIdAndUpdate(
            newDepartmentId,
            { $addToSet: { members: user._id } }
          );
        }
        
        user.assignedDepartment = newDepartmentId || undefined;
      }

      const updatedUser = await user.save();
      
      res.status(200).json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        startup: updatedUser.startup,
        assignedDepartment: updatedUser.assignedDepartment,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Assign user to department
// @route   POST /api/users/:userId/assign-department
// @access  Private/Admin
const assignDepartment = async (req, res) => {
  try {
    const { departmentId } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Remove from old department's members array
    if (user.assignedDepartment) {
      await Department.findByIdAndUpdate(
        user.assignedDepartment,
        { $pull: { members: user._id } }
      );
    }
    
    // Update user's department
    user.assignedDepartment = departmentId;
    await user.save();
    
    // Add to new department's members array
    await Department.findByIdAndUpdate(
      departmentId,
      { $addToSet: { members: user._id } }
    );
    
    res.status(200).json({
      message: 'User assigned to department successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        assignedDepartment: user.assignedDepartment
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error assigning department',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  assignDepartment
};