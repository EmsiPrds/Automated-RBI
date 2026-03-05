import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('username').optional().trim().isLength({ max: 50 }),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
    body('role').optional().isIn(['resident', 'encoder', 'secretary', 'punong_barangay', 'viewer', 'admin']),
  ],
  asyncHandler(register)
);

router.post(
  '/login',
  [body('email').trim().notEmpty(), body('password').notEmpty()],
  asyncHandler(login)
);

router.get('/me', protect, getMe);

export default router;
