import express from 'express';
import { getMyCard, verifyByIdNumber } from '../controllers/residentCardController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/verify/:idNumber', verifyByIdNumber);

router.use(protect);
router.get('/', requireRole('resident'), getMyCard);

export default router;
