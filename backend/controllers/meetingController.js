import asyncHandler from 'express-async-handler';
import Meeting from '../models/Meeting.js';
import Department from '../models/Department.js';
import User from '../models/User.js';

// @desc    Get all meetings for a specific department
// @route   GET /api/departments/:departmentId/meetings
// @access  Private
const getMeetingsByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { startDate, endDate, status } = req.query;
  
  // Check if department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if user has access to this department
  if (req.user.role === 'editor' && req.user.assignedDepartment?.toString() !== departmentId) {
    res.status(403);
    throw new Error('Not authorized to view meetings for this department');
  }

  // Build query
  const query = { department: departmentId };
  
  // Filter by date range if provided
  if (startDate || endDate) {
    query.meetingDate = {};
    if (startDate) query.meetingDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.meetingDate.$lte = end;
    }
  }
  
  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  const meetings = await Meeting.find(query)
    .sort({ meetingDate: 1 })
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .populate('organizer', 'name email')
    .populate('attendees.user', 'name email');
    
  res.status(200).json({
    success: true,
    count: meetings.length,
    data: meetings
  });
});

// @desc    Get user's meetings
// @route   GET /api/meetings/my-meetings
// @access  Private
const getMyMeetings = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  
  // Build query
  const query = {
    $or: [
      { 'attendees.user': req.user._id },
      { organizer: req.user._id }
    ]
  };
  
  // Filter by date range if provided
  if (startDate || endDate) {
    query.meetingDate = {};
    if (startDate) query.meetingDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.meetingDate.$lte = end;
    }
  }
  
  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  const meetings = await Meeting.find(query)
    .sort({ meetingDate: 1 })
    .populate('department', 'name')
    .populate('organizer', 'name email')
    .populate('attendees.user', 'name email');
    
  res.status(200).json({
    success: true,
    count: meetings.length,
    data: meetings
  });
});

// @desc    Get single meeting
// @route   GET /api/meetings/:id
// @access  Private
const getMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id)
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .populate('organizer', 'name email')
    .populate('attendees.user', 'name email');

  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  // Check if user is an attendee or organizer
  const isAttendee = meeting.attendees.some(a => a.user._id.toString() === req.user._id.toString());
  const isOrganizer = meeting.organizer._id.toString() === req.user._id.toString();
  const isDepartmentEditor = req.user.role === 'editor' && 
    req.user.assignedDepartment?.toString() === meeting.department._id.toString();
  
  if (!isAttendee && !isOrganizer && req.user.role !== 'admin' && !isDepartmentEditor) {
    res.status(403);
    throw new Error('Not authorized to access this meeting');
  }

  res.status(200).json({
    success: true,
    data: meeting
  });
});

// @desc    Create new meeting
// @route   POST /api/meetings
// @access  Private
const createMeeting = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    agenda, 
    meetingDate, 
    duration, 
    location, 
    meetingLink, 
    department: departmentId, 
    meetingType,
    attendees = [],
    isPrivate = false,
    recurring = { isRecurring: false }
  } = req.body;
  
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
    throw new Error('Not authorized to create meetings for this department');
  }

  // Validate attendees
  const attendeeIds = [...new Set(attendees)]; // Remove duplicates
  const attendeeUsers = await User.find({ _id: { $in: attendeeIds } });
  
  if (attendeeUsers.length !== attendeeIds.length) {
    res.status(400);
    throw new Error('One or more attendees not found');
  }

  // Create meeting
  const meeting = await Meeting.create({
    title,
    description,
    agenda,
    meetingDate,
    duration: duration || 60, // Default to 60 minutes
    location,
    meetingLink: meetingType === 'virtual' || meetingType === 'hybrid' ? meetingLink : undefined,
    department: departmentId,
    meetingType,
    createdBy: req.user._id,
    organizer: req.user._id, // Default to creator as organizer
    attendees: attendeeIds.map(userId => ({
      user: userId,
      status: 'pending',
      responseDate: new Date()
    })),
    isPrivate,
    recurring
  });

  // Populate the related fields for the response
  await meeting.populate('department', 'name');
  await meeting.populate('createdBy organizer', 'name email');
  await meeting.populate('attendees.user', 'name email');

  // TODO: Send meeting invitations to attendees

  res.status(201).json({
    success: true,
    data: meeting
  });
});

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private
const updateMeeting = asyncHandler(async (req, res) => {
  let meeting = await Meeting.findById(req.params.id)
    .populate('department', 'name')
    .populate('createdBy', 'name email')
    .populate('organizer', 'name email')
    .populate('attendees.user', 'name email');

  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  // Check permissions - only organizer, admin, or department editor can update
  const isOrganizer = meeting.organizer._id.toString() === req.user._id.toString();
  const isDepartmentEditor = req.user.role === 'editor' && 
    req.user.assignedDepartment?.toString() === meeting.department._id.toString();
    
  if (req.user.role !== 'admin' && !isOrganizer && !isDepartmentEditor) {
    res.status(403);
    throw new Error('Not authorized to update this meeting');
  }

  // Prevent changing department for non-admins
  if (req.body.department && 
      req.body.department !== meeting.department._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to move meetings between departments');
  }

  // Handle attendees update if provided
  if (req.body.attendees) {
    const attendeeIds = [...new Set(req.body.attendees)]; // Remove duplicates
    const attendeeUsers = await User.find({ _id: { $in: attendeeIds } });
    
    if (attendeeUsers.length !== attendeeIds.length) {
      res.status(400);
      throw new Error('One or more attendees not found');
    }

    // Preserve existing attendee statuses when possible
    const updatedAttendees = attendeeIds.map(userId => {
      const existingAttendee = meeting.attendees.find(a => 
        a.user._id.toString() === userId.toString()
      );
      
      return {
        user: userId,
        status: existingAttendee?.status || 'pending',
        responseDate: existingAttendee?.responseDate || new Date()
      };
    });

    req.body.attendees = updatedAttendees;
  }

  // Update meeting
  meeting = await Meeting.findByIdAndUpdate(
    req.params.id, 
    { 
      ...req.body,
      updatedAt: new Date(),
      // Don't allow changing the organizer unless you're an admin
      ...(req.user.role !== 'admin' ? { organizer: meeting.organizer } : {})
    },
    { new: true, runValidators: true }
  )
    .populate('department', 'name')
    .populate('createdBy organizer', 'name email')
    .populate('attendees.user', 'name email');

  // TODO: Send meeting update notifications to attendees

  res.status(200).json({
    success: true,
    data: meeting
  });
});

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private
const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  // Check permissions - only organizer, admin, or department editor can delete
  const isOrganizer = meeting.organizer.toString() === req.user._id.toString();
  const isDepartmentEditor = req.user.role === 'editor' && 
    req.user.assignedDepartment?.toString() === meeting.department.toString();
    
  if (req.user.role !== 'admin' && !isOrganizer && !isDepartmentEditor) {
    res.status(403);
    throw new Error('Not authorized to delete this meeting');
  }

  await meeting.deleteOne();

  // TODO: Send meeting cancellation notifications to attendees

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update attendee status
// @route   PATCH /api/meetings/:id/rsvp
// @access  Private
const updateAttendeeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['accepted', 'declined', 'tentative'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be one of: accepted, declined, tentative');
  }

  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }

  // Check if user is an attendee
  const attendeeIndex = meeting.attendees.findIndex(a => 
    a.user.toString() === req.user._id.toString()
  );

  if (attendeeIndex === -1) {
    res.status(403);
    throw new Error('You are not an attendee of this meeting');
  }

  // Update attendee status
  meeting.attendees[attendeeIndex].status = status;
  meeting.attendees[attendeeIndex].responseDate = new Date();
  
  await meeting.save();

  // TODO: Notify organizer of status change

  res.status(200).json({
    success: true,
    data: {
      meetingId: meeting._id,
      userId: req.user._id,
      status
    }
  });
});

// @desc    Get meeting statistics
// @route   GET /api/departments/:departmentId/meetings/stats
// @access  Private
const getMeetingStats = asyncHandler(async (req, res) => {
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
    throw new Error('Not authorized to view meetings for this department');
  }

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [stats] = await Meeting.aggregate([
    { $match: { department: department._id } },
    {
      $facet: {
        // Count by status
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        // Count by type
        byType: [
          { $group: { _id: '$meetingType', count: { $sum: 1 } } }
        ],
        // Upcoming meetings count
        upcomingCount: [
          { $match: { meetingDate: { $gte: now } } },
          { $count: 'count' }
        ],
        // Recent meetings
        recentMeetings: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 1,
              title: 1,
              meetingDate: 1,
              status: 1,
              meetingType: 1
            }
          }
        ],
        // Meetings in last 30 days
        recentActivity: [
          { 
            $match: { 
              $or: [
                { createdAt: { $gte: thirtyDaysAgo } },
                { updatedAt: { $gte: thirtyDaysAgo } }
              ]
            } 
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  // Format the response
  const result = {
    byStatus: stats.byStatus,
    byType: stats.byType,
    upcomingCount: stats.upcomingCount[0]?.count || 0,
    recentMeetings: stats.recentMeetings,
    recentActivity: stats.recentActivity
  };

  res.status(200).json({
    success: true,
    data: result
  });
});

export {
  getMeetingsByDepartment,
  getMyMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  updateAttendeeStatus,
  getMeetingStats
};
