import express from 'express';
import { generate } from '../controllers/certificateController.js';
import { protect } from '../middleware/auth.js';
import { requireBarangayScope } from '../middleware/roleCheck.js';

const router = express.Router();
router.use(protect);
router.get('/:type', requireBarangayScope, generate);

export default router;
