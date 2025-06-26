import express from 'express';
const router = express.Router();
import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
} from '../controllers/userController.js';
import { protect} from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';

// User-specific routes. These routes are for the logged-in user to manage their own profile.
// Both '/profile' and '/me' routes are supported for getting the current user's profile.
router
  .route('/profile')
  .get(protect, getUserProfile)      // Any logged-in user can get their own profile
  .put(protect, updateUserProfile);  // Any logged-in user can update their own profile

// Alias for /profile that follows REST conventions
router
  .route('/me')
  .get(protect, getUserProfile);     // Any logged-in user can get their own profile

// Admin-specific routes. These require the user to have the 'admin' role.
// We use permit('admin') to enforce this.
router
  .route('/')
  .get(protect, permit('admin'), getUsers); // Only admins can get a list of all users

router
  .route('/:id')
  .get(protect, permit('admin'), getUserById)      // Only admins can get a specific user by ID
  .put(protect, permit('admin'), updateUser)       // Only admins can update a specific user
  .delete(protect, permit('admin'), deleteUser); // Only admins can delete a specific user

export default router;