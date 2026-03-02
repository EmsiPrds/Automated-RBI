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
import { requireRole, requireBarangayScope } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(protect);

router.get('/', requireBarangayScope, list);
router.get('/:id', requireBarangayScope, getOne);

router.post(
  '/',
  requireBarangayScope,
  [
    body('region').optional().trim(),
    body('province').optional().trim(),
    body('cityMunicipality').optional().trim(),
    body('barangay').optional().trim(),
    body('householdAddress').optional().trim(),
    body('householdNumber').optional().trim(),
    body('inhabitants').optional().isArray(),
  ],
  create
);

router.put(
  '/:id',
  requireBarangayScope,
  [
    body('region').optional().trim(),
    body('province').optional().trim(),
    body('cityMunicipality').optional().trim(),
    body('barangay').optional().trim(),
    body('householdAddress').optional().trim(),
    body('householdNumber').optional().trim(),
    body('inhabitants').optional().isArray(),
    body('dataSource').optional().isIn(['self-entered', 'staff-assisted', 'encoded-from-paper']),
  ],
  update
);

router.delete('/:id', requireBarangayScope, remove);

router.patch('/:id/submit', requireBarangayScope, body('preparedBy').optional().trim(), submit);
router.patch('/:id/certify', requireRole('secretary'), certify);
router.patch('/:id/validate', requireRole('punong_barangay'), validate);

export default router;
