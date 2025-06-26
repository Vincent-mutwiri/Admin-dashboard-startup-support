import express from 'express';
import {
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  getDeliverablesByMilestone
} from '../controllers/deliverableController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// Routes for /api/deliverables
router.route('/')
  .post(createDeliverable);

router.route('/:id')
  .put(updateDeliverable)
  .delete(deleteDeliverable);

// Get all deliverables for a specific milestone
router.get('/milestone/:milestoneId', getDeliverablesByMilestone);

export default router;
