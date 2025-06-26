import express from 'express';
import { getAllDepartments } from '../controllers/departmentController.js';

const router = express.Router();

// @route   GET /api/departments
// @desc    Get a list of all departments
// @access  Public
router.get('/', getAllDepartments);

export default router;
