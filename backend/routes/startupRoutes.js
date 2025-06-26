import express from 'express';
import { protect, permit } from '../middleware/authMiddleware.js';
import {
  createStartup,
  getStartups,
  updateStartup,
  deleteStartup,
} from '../controllers/startupController.js';

const router = express.Router();

// Public routes (if any)
router.route('/').get(protect, getStartups);

// Protected routes
router.route('/').post(protect, permit('admin', 'editor'), createStartup);
router
  .route('/:id')
  .put(protect, permit('admin', 'editor'), updateStartup)
  .delete(protect, permit('admin'), deleteStartup);

export default router;
