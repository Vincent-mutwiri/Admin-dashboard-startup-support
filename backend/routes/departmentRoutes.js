import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { protect, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.use(permit('admin'));
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
