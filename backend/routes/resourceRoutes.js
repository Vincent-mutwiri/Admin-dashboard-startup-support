import express from 'express';
import { protect, permit } from '../middleware/authMiddleware.js';
import {
  getResourcesByDepartment,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getResourceStats
} from '../controllers/resourceController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// These routes will be mounted under /api/departments/:departmentId/
// Get resource statistics for a specific department - Accessible by department members
router.get(
  '/stats',
  permit('admin', 'editor', 'user'),
  getResourceStats
);

// Get all resources for a specific department - Accessible by department members
router.get(
  '/',
  permit('admin', 'editor', 'user'),
  getResourcesByDepartment
);

// Create a new resource - Only admins and editors can create
router.post(
  '/',
  permit('admin', 'editor'),
  createResource
);

// Get single resource - Accessible based on resource permissions
router.get(
  '/:id',
  permit('admin', 'editor', 'user'),
  getResource
);

// Update a resource - Only admins and department editors can update
router.put(
  '/:id',
  permit('admin', 'editor'),
  updateResource
);

// Delete a resource - Only admins and department editors can delete
router.delete(
  '/:id',
  permit('admin', 'editor'),
  deleteResource
);

export default router;
