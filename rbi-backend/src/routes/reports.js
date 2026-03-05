import express from 'express';
import {
  summary,
  dashboard,
  seniorCitizens,
  pwdList,
  exportPdf,
  exportExcel,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { requireBarangayScope } from '../middleware/roleCheck.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);
router.get('/summary', requireRole('secretary', 'punong_barangay', 'viewer', 'admin'), asyncHandler(summary));
router.get('/dashboard', requireRole('encoder', 'secretary', 'punong_barangay', 'viewer', 'admin'), requireBarangayScope, asyncHandler(dashboard));
router.get('/senior-citizens', requireRole('secretary', 'punong_barangay', 'viewer', 'admin'), asyncHandler(seniorCitizens));
router.get('/pwd-list', requireRole('secretary', 'punong_barangay', 'viewer', 'admin'), asyncHandler(pwdList));
router.get('/export/pdf', requireRole('secretary', 'punong_barangay', 'viewer', 'admin'), asyncHandler(exportPdf));
router.get('/export/excel', requireRole('secretary', 'punong_barangay', 'viewer', 'admin'), asyncHandler(exportExcel));

export default router;
