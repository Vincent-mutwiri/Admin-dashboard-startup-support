import asyncHandler from 'express-async-handler';
import Milestone from '../models/Milestone.js';
import Department from '../models/Department.js';

// @desc    Get all milestones for a specific department
// @route   GET /api/departments/:departmentId/milestones
// @access  Private
const getMilestonesByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  
  // Check if department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if user has access to this department
  if (req.user.role === 'editor' && req.user.assignedDepartment?.toString() !== departmentId) {
    res.status(403);
    throw new Error('Not authorized to view milestones for this department');
  }

  const milestones = await Milestone.find({ department: departmentId })
    .sort({ dueDate: 1, status: 1 })
    .populate('createdBy', 'name email');
    
  res.status(200).json({
    success: true,
    count: milestones.length,
    data: milestones
  });
});

// @desc    Get single milestone
// @route   GET /api/milestones/:id
// @access  Private
const getMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id)
    .populate('department', 'name')
    .populate('createdBy', 'name email');

  if (!milestone) {
    res.status(404);
    throw new Error('Milestone not found');
  }

  // Check if user has access
  if (req.user.role === 'editor' && 
      req.user.assignedDepartment?.toString() !== milestone.department._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this milestone');
  }

  res.status(200).json({
    success: true,
    data: milestone
  });
});

// @desc    Create new milestone
// @route   POST /api/milestones
// @access  Private
const createMilestone = asyncHandler(async (req, res) => {
  const { title, description, status, dueDate, department: departmentId } = req.body;
  
  // Validate department
  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check permissions
  if (req.user.role === 'editor' && 
      req.user.assignedDepartment?.toString() !== departmentId) {
    res.status(403);
    throw new Error('Not authorized to add milestones to this department');
  }

  // Create milestone
  const milestone = await Milestone.create({
    title,
    description,
    status,
    dueDate,
    department: departmentId,
    createdBy: req.user._id
  });

  // Populate the department and createdBy fields for the response
  await milestone.populate('department', 'name');
  await milestone.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    data: milestone
  });
});

// @desc    Update milestone
// @route   PUT /api/milestones/:id
// @access  Private
const updateMilestone = asyncHandler(async (req, res) => {
  let milestone = await Milestone.findById(req.params.id);

  if (!milestone) {
    res.status(404);
    throw new Error('Milestone not found');
  }

  // Check permissions
  const isEditorOfDepartment = req.user.role === 'editor' && 
    req.user.assignedDepartment?.toString() === milestone.department.toString();
    
  if (req.user.role !== 'admin' && !isEditorOfDepartment) {
    res.status(403);
    throw new Error('Not authorized to update this milestone');
  }

  // Prevent changing department for editors
  if (req.user.role === 'editor' && 
      req.body.department && 
      req.body.department !== milestone.department.toString()) {
    res.status(403);
    throw new Error('Not authorized to move milestones between departments');
  }

  // Update milestone
  milestone = await Milestone.findByIdAndUpdate(
    req.params.id, 
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('department', 'name')
    .populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: milestone
  });
});

// @desc    Delete milestone
// @route   DELETE /api/milestones/:id
// @access  Private/Admin & Department Editor
const deleteMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);

  if (!milestone) {
    res.status(404);
    throw new Error('Milestone not found');
  }

  // Check permissions
  const isEditorOfDepartment = req.user.role === 'editor' && 
    req.user.assignedDepartment?.toString() === milestone.department.toString();
    
  if (req.user.role !== 'admin' && !isEditorOfDepartment) {
    res.status(403);
    throw new Error('Not authorized to delete this milestone');
  }

  await milestone.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get milestones summary for dashboard
// @route   GET /api/departments/:departmentId/milestones/summary
// @access  Private
const getMilestonesSummary = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  
  // Check if department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if user has access to this department
  if (req.user.role === 'editor' && req.user.assignedDepartment?.toString() !== departmentId) {
    res.status(403);
    throw new Error('Not authorized to view milestones for this department');
  }

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const [statusCounts, upcomingMilestones, recentMilestones] = await Promise.all([
    // Count by status
    Milestone.aggregate([
      { $match: { department: department._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    // Upcoming milestones (next 7 days)
    Milestone.find({
      department: department._id,
      dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      status: { $in: ['Not Started', 'In Progress'] }
    })
      .sort({ dueDate: 1 })
      .limit(5),
    // Recently completed milestones
    Milestone.find({
      department: department._id,
      status: 'Completed',
      completedAt: { $gte: thirtyDaysAgo }
    })
      .sort({ completedAt: -1 })
      .limit(5)
  ]);

  // Transform status counts to object
  const statusSummary = statusCounts.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      status: statusSummary,
      upcoming: upcomingMilestones,
      recentlyCompleted: recentMilestones
    }
  });
});

export {
  getMilestonesByDepartment,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestonesSummary
};
