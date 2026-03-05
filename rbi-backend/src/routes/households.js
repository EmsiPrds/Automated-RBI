import express from 'express';
import { body } from 'express-validator';
import {
  list,
  getOne,
  create,
  update,
  remove,
  certify,
  validate,
  submit,
} from '../controllers/householdController.js';
import { protect } from '../middleware/auth.js';
import { requireRole, requireBarangayScope, requireNotViewer } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(protect);

router.get('/', requireBarangayScope, list);
router.get('/:id', requireBarangayScope, getOne);

router.post(
  '/',
  requireBarangayScope,
  requireNotViewer,
  [
    body('region').optional().trim(),
    body('province').optional().trim(),
    body('cityMunicipality').optional().trim(),
    body('barangay').optional().trim(),
    body('householdAddress').optional().trim(),
    body('householdNumber').optional().trim(),
    body('headOfFamily').optional().trim(),
    body('inhabitants').optional().isArray(),
  ],
  create
);

router.put(
  '/:id',
  requireBarangayScope,
  requireNotViewer,
  [
    body('region').optional().trim(),
    body('province').optional().trim(),
    body('cityMunicipality').optional().trim(),
    body('barangay').optional().trim(),
    body('householdAddress').optional().trim(),
    body('householdNumber').optional().trim(),
    body('headOfFamily').optional().trim(),
    body('inhabitants').optional().isArray(),
    body('dataSource').optional().isIn(['self-entered', 'staff-assisted', 'encoded-from-paper']),
  ],
  update
);

router.delete('/:id', requireBarangayScope, requireNotViewer, remove);

router.patch('/:id/submit', requireBarangayScope, requireNotViewer, body('preparedBy').optional().trim(), submit);
router.patch('/:id/certify', requireRole('secretary', 'admin'), certify);
router.patch('/:id/validate', requireRole('punong_barangay', 'admin'), validate);

export default router;
