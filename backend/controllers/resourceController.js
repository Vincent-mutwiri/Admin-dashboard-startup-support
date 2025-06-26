import asyncHandler from 'express-async-handler';
import Resource from '../models/Resource.js';
import Department from '../models/Department.js';

// @desc    Get all resources for a specific department
// @route   GET /api/departments/:departmentId/resources
// @access  Private
const getResourcesByDepartment = asyncHandler(async (req, res) => {
  // Get departmentId from URL params or from the request body (set by our middleware)
  const departmentId = req.params.departmentId || req.departmentId;
  
  if (!departmentId) {
    res.status(400);
    throw new Error('Department ID is required');
  }
  
  // Check if department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if user has access to this department
  if (req.user.role === 'editor' && req.user.assignedDepartment?.toString() !== departmentId) {
    res.status(403);
    throw new Error('Not authorized to view resources for this department');
  }

  // Build query
  const query = { department: departmentId };
  
  // Filter by type if provided
  if (req.query.type) {
    query.type = req.query.type;
  }
  
  // Filter by tag if provided
  if (req.query.tag) {
    query.tags = req.query.tag.toLowerCase();
  }

  const resources = await Resource.find(query)
    .sort({ createdAt: -1 })
    .populate('department', 'name')
    .populate('createdBy', 'name email');
    
  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id)
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .populate('accessList', 'name email');

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Check if user has access
  const hasAccess = resource.isPublic || 
                   resource.accessLevel === 'department' ||
                   resource.accessList.some(userId => userId.equals(req.user._id));

  if (!hasAccess && 
      req.user.role !== 'admin' && 
      (req.user.role !== 'editor' || 
       req.user.assignedDepartment?.toString() !== resource.department._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to access this resource');
  }

  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private
const createResource = asyncHandler(async (req, res) => {
  const { title, description, type, link, department: departmentId, tags = [], isPublic = false, accessLevel = 'department' } = req.body;
  
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
    throw new Error('Not authorized to add resources to this department');
  }

  // Create resource
  const resource = await Resource.create({
    title,
    description,
    type,
    link,
    department: departmentId,
    createdBy: req.user._id,
    tags: [...new Set(tags.map(tag => tag.toLowerCase().trim()))], // Remove duplicates and normalize
    isPublic,
    accessLevel,
    accessList: accessLevel === 'restricted' ? req.body.accessList || [] : []
  });

  // Populate the related fields for the response
  await resource.populate('department', 'name');
  await resource.populate('createdBy', 'name email');
  await resource.populate('accessList', 'name email');

  res.status(201).json({
    success: true,
    data: resource
  });
});

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
const updateResource = asyncHandler(async (req, res) => {
  let resource = await Resource.findById(req.params.id)
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .populate('accessList', 'name email');

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Check permissions
  const isEditorOfDepartment = req.user.role === 'editor' && 
    req.user.assignedDepartment?.toString() === resource.department._id.toString();
    
  if (req.user.role !== 'admin' && !isEditorOfDepartment) {
    res.status(403);
    throw new Error('Not authorized to update this resource');
  }

  // Prevent changing department for editors
  if (req.user.role === 'editor' && 
      req.body.department && 
      req.body.department !== resource.department._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to move resources between departments');
  }

  // Handle tags update
  if (req.body.tags) {
    req.body.tags = [...new Set(req.body.tags.map(tag => tag.toLowerCase().trim()))];
  }

  // Update resource
  resource = await Resource.findByIdAndUpdate(
    req.params.id, 
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .populate('accessList', 'name email');

  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin & Department Editor
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Check permissions
  const isEditorOfDepartment = req.user.role === 'editor' && 
    req.user.assignedDepartment?.toString() === resource.department.toString();
    
  if (req.user.role !== 'admin' && !isEditorOfDepartment) {
    res.status(403);
    throw new Error('Not authorized to delete this resource');
  }

  // TODO: Delete associated file from storage if it's a file resource
  await resource.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get resource statistics
// @route   GET /api/departments/:departmentId/resources/stats
// @access  Private
const getResourceStats = asyncHandler(async (req, res) => {
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
    throw new Error('Not authorized to view resources for this department');
  }

  const stats = await Resource.aggregate([
    { $match: { department: department._id } },
    {
      $facet: {
        // Count by type
        byType: [
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        // Count by tag
        byTag: [
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        // Recent uploads
        recentUploads: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 1,
              title: 1,
              type: 1,
              createdAt: 1,
              fileSize: 1
            }
          }
        ],
        // Total count and size
        totals: [
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalSize: { $sum: { $ifNull: ['$fileSize', 0] } }
            }
          }
        ]
      }
    }
  ]);

  // Format the response
  const result = {
    byType: stats[0].byType,
    byTag: stats[0].byTag,
    recentUploads: stats[0].recentUploads,
    totalCount: stats[0].totals[0]?.totalCount || 0,
    totalSize: stats[0].totals[0]?.totalSize || 0
  };

  res.status(200).json({
    success: true,
    data: result
  });
});

export {
  getResourcesByDepartment,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getResourceStats
};
