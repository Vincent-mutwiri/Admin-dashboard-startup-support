import express from 'express';
const router = express.Router();
import {
  signupUser,
  loginUser,
  logoutUser,
} from '../controllers/authController.js';

// Define the routes and link them to the controller functions
router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

export default router;