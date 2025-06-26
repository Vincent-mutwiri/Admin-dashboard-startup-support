import express from 'express';
import { testDatabase } from '../controllers/testController.js';

const router = express.Router();

// Public test route
router.get('/', testDatabase);

export default router;
