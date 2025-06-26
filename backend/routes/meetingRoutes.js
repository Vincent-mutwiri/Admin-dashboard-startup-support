import express from 'express';
import { protect, permit } from '../middleware/authMiddleware.js';
import {
  getMeetingsByDepartment,
  getMyMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  updateAttendeeStatus,
  getMeetingStats
} from '../controllers/meetingController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get meeting statistics for dashboard - Accessible by department members
router.get(
  '/departments/:departmentId/stats',
  permit('admin', 'editor', 'user'),
  getMeetingStats
);

// Get all meetings for a specific department - Accessible by department members
router.get(
  '/departments/:departmentId',
  permit('admin', 'editor', 'user'),
  getMeetingsByDepartment
);

// Get current user's meetings
router.get(
  '/my-meetings',
  permit('admin', 'editor', 'user'),
  getMyMeetings
);

// Create a new meeting - Only admins and editors can create
router.post(
  '/',
  permit('admin', 'editor'),
  createMeeting
);

// Get single meeting - Accessible by attendees, organizer, or department admin/editor
router.get(
  '/:id',
  permit('admin', 'editor', 'user'),
  getMeeting
);

// Update a meeting - Only organizer, admin, or department editor can update
router.put(
  '/:id',
  permit('admin', 'editor', 'user'),
  updateMeeting
);

// Delete a meeting - Only organizer, admin, or department editor can delete
router.delete(
  '/:id',
  permit('admin', 'editor', 'user'),
  deleteMeeting
);

// Update attendee status (RSVP)
router.patch(
  '/:id/rsvp',
  permit('admin', 'editor', 'user'),
  updateAttendeeStatus
);

export default router;
