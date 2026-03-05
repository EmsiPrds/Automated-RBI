import express from 'express';
import { getMyCard, verifyByIdNumber } from '../controllers/residentCardController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/verify/:idNumber', asyncHandler(verifyByIdNumber));

router.use(protect);
router.get('/', requireRole('resident'), asyncHandler(getMyCard));

export default router;
