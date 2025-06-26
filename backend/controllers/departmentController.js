import Department from '../models/Department.js';

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public // or Private, depending on your app's needs
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).select('id name');
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching departments' });
  }
};

export { getAllDepartments };
