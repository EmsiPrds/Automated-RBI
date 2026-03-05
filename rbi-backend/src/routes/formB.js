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
} from '../controllers/formBController.js';
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
    body('householdNumber').optional().trim(),
    body('residenceAddress').optional().trim(),
    body('lastName').optional().trim(),
    body('firstName').optional().trim(),
    body('middleName').optional().trim(),
    body('nameExtension').optional().trim(),
    body('placeOfBirth').optional().trim(),
    body('citizenship').optional().trim(),
    body('religion').optional().trim(),
    body('contactNumber').optional().trim(),
    body('email').optional().trim(),
    body('occupation').optional().trim(),
    body('philSysCardNo').optional().trim(),
    body('courseSpecification').optional().trim(),
    body('dateAccomplished').optional().isISO8601(),
    body('dataSource').optional().isIn(['self-entered', 'staff-assisted', 'encoded-from-paper']),
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
    body('householdNumber').optional().trim(),
    body('residenceAddress').optional().trim(),
    body('lastName').optional().trim(),
    body('firstName').optional().trim(),
    body('middleName').optional().trim(),
    body('nameExtension').optional().trim(),
    body('placeOfBirth').optional().trim(),
    body('citizenship').optional().trim(),
    body('religion').optional().trim(),
    body('contactNumber').optional().trim(),
    body('email').optional().trim(),
    body('occupation').optional().trim(),
    body('philSysCardNo').optional().trim(),
    body('courseSpecification').optional().trim(),
    body('dateAccomplished').optional().isISO8601(),
    body('dataSource').optional().isIn(['self-entered', 'staff-assisted', 'encoded-from-paper']),
  ],
  update
);

router.delete('/:id', requireBarangayScope, requireNotViewer, remove);

router.patch('/:id/submit', requireBarangayScope, requireNotViewer, body('preparedBy').optional().trim(), submit);
router.patch('/:id/certify', requireRole('secretary', 'admin'), certify);
router.patch('/:id/validate', requireRole('punong_barangay', 'admin'), validate);

export default router;
