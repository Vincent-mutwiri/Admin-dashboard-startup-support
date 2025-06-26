import asyncHandler from 'express-async-handler';
import Department from '../models/Department.js';

// @desc    Get all departments with startup counts
// @route   GET /api/departments
// @access  Public
const getAllDepartments = asyncHandler(async (req, res) => {
  try {
    const departmentsWithCounts = await Department.aggregate([
      {
        // Step 1: Look up startups that reference this department
        $lookup: {
          from: 'startups', // The collection name for startups
          localField: '_id',
          foreignField: 'department',
          as: 'startups',
        },
      },
      {
        // Step 2: Add a new field 'startupCount' with the size of the startups array
        $addFields: {
          startupCount: { $size: '$startups' },
        },
      },
      {
        // Step 3: Remove the full startups array from the final output
        $project: {
          name: 1,
          description: 1,
          createdAt: 1,
          startupCount: 1,
        },
      },
      {
        // Step 4: Sort the results
        $sort: { name: 1 },
      },
    ]);
    res.status(200).json(departmentsWithCounts);
  } catch (error) {
    console.error('Error fetching departments with counts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get single department by ID
// @route   GET /api/departments/:id
// @access  Public
const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  
  if (department) {
    res.json(department);
  } else {
    res.status(404);
    throw new Error('Department not found');
  }
});

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const departmentExists = await Department.findOne({ name });
  
  if (departmentExists) {
    res.status(400);
    throw new Error('Department already exists');
  }

  const department = await Department.create({
    name,
    description: description || ''
  });

  if (department) {
    res.status(201).json(department);
  } else {
    res.status(400);
    throw new Error('Invalid department data');
  }
});

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if name is being updated and if it already exists
  if (name && name !== department.name) {
    const departmentExists = await Department.findOne({ name });
    if (departmentExists) {
      res.status(400);
      throw new Error('Department with this name already exists');
    }
  }

  department.name = name || department.name;
  department.description = description !== undefined ? description : department.description;
  
  const updatedDepartment = await department.save();
  res.json(updatedDepartment);
});

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('startups');

  if (!department) {
    return res.status(404).json({ 
      success: false,
      message: 'Department not found' 
    });
  }

  // Check if there are any startups associated with this department
  const startupsCount = department.startups?.length || 0;
  if (startupsCount > 0) {
    return res.status(400).json({ 
      success: false,
      message: `Cannot delete department. It has ${startupsCount} associated startup(s).`
    });
  }

  await department.deleteOne();
  res.status(200).json({ 
    success: true,
    message: 'Department removed successfully' 
  });
});

export {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
