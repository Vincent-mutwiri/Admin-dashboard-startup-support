import express from 'express';
import { protect, permit } from '../middleware/authMiddleware.js';
import {
  getMilestonesByDepartment,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestonesSummary,
  addCommentToMilestone,
  getMilestoneComments
} from '../controllers/milestoneController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get milestones summary for dashboard - Only accessible by department members
router.get(
  '/departments/:departmentId/summary',
  permit('admin', 'editor', 'user'),
  getMilestonesSummary
);

// Get all milestones for a specific department - Only accessible by department members
router.get(
  '/departments/:departmentId',
  permit('admin', 'editor', 'user'),
  getMilestonesByDepartment
);

// Alias for backward compatibility
router.get(
  '/departments/:departmentId/milestones',
  permit('admin', 'editor', 'user'),
  getMilestonesByDepartment
);

// Create a new milestone - Only admins and editors can create
router.post(
  '/',
  permit('admin', 'editor'),
  createMilestone
);

// Get single milestone - Accessible by department members
router.get(
  '/:id',
  permit('admin', 'editor', 'user'),
  getMilestone
);

// Update a milestone - Only admins and department editors can update
router.put(
  '/:id',
  permit('admin', 'editor'),
  updateMilestone
);

// Delete a milestone - Only admins and department editors can delete
router.delete(
  '/:id',
  permit('admin', 'editor'),
  deleteMilestone
);

// Comment routes
router.route('/:id/comments')
  // Get all comments for a milestone - Accessible by department members
  .get(
    permit('admin', 'editor', 'user'),
    getMilestoneComments
  )
  // Add a comment to a milestone - Accessible by department members
  .post(
    permit('admin', 'editor', 'user'),
    addCommentToMilestone
  );

export default router;
