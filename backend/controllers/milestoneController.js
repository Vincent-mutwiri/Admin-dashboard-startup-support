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

// @desc    Add a comment to a milestone
// @route   POST /api/milestones/:id/comments
// @access  Private
const addCommentToMilestone = asyncHandler(async (req, res) => {
  try {
    console.log('=== ADD COMMENT REQUEST ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user ? { 
      id: req.user._id, 
      role: req.user.role,
      assignedDepartment: req.user.assignedDepartment 
    } : 'No user');
    
    const { text } = req.body;
    
    // Validate comment text
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.error('Validation failed: Invalid comment text:', text);
      return res.status(400).json({
        success: false,
        error: 'Please provide valid comment text'
      });
    }

    // Find the milestone
    const milestone = await Milestone.findById(req.params.id);
    
    if (!milestone) {
      console.error(`Milestone not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Milestone not found'
      });
    }

    // Check authorization
    const hasAccess = req.user.role === 'admin' || 
      (req.user.assignedDepartment && 
       req.user.assignedDepartment.toString() === milestone.department.toString());
    
    if (!hasAccess) {
      console.error('Authorization failed:', {
        userRole: req.user.role,
        userDept: req.user.assignedDepartment,
        milestoneDept: milestone.department
      });
      return res.status(403).json({
        success: false,
        error: 'Not authorized to comment on this milestone'
      });
    }

    // Create and save the comment
    const comment = {
      text: text.trim(),
      author: req.user._id,
      createdAt: new Date()
    };

    console.log('Adding comment:', comment);
    milestone.comments.push(comment);
    await milestone.save();
    
    // Get the populated comment
    const updatedMilestone = await Milestone.findById(milestone._id)
      .populate({
        path: 'comments.author',
        select: 'name email',
        options: { lean: true }
      });
      
    const newComment = updatedMilestone.comments[updatedMilestone.comments.length - 1];
    
    console.log('Comment added successfully:', newComment);
    
    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Error in addCommentToMilestone:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
      user: req.user || 'No user'
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error while adding comment'
    });
  }
});

// @desc    Get all comments for a milestone
// @route   GET /api/milestones/:id/comments
// @access  Private
const getMilestoneComments = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id)
    .select('comments')
    .populate({
      path: 'comments.author',
      select: 'name email avatar'
    });

  if (!milestone) {
    res.status(404);
    throw new Error('Milestone not found');
  }

  // Check if user has access to this milestone's department
  const hasAccess = req.user.role === 'admin' || 
    (req.user.assignedDepartment && 
     req.user.assignedDepartment.toString() === milestone.department.toString());
  
  if (!hasAccess) {
    res.status(403);
    throw new Error('Not authorized to view comments for this milestone');
  }

  res.status(200).json({
    success: true,
    count: milestone.comments.length,
    data: milestone.comments
  });
});

export {
  getMilestonesByDepartment,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestonesSummary,
  addCommentToMilestone,
  getMilestoneComments
};
