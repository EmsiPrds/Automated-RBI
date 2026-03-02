import express from 'express';
import { summary } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();
router.use(protect);
router.get('/summary', requireRole('secretary', 'punong_barangay'), summary);

export default router;
