import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { logActivity } from '../utils/activityLogger.js';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, username, password, fullName, role, barangay, cityMunicipality, province, region } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    if (username) {
      const existingUsername = await User.findOne({ username: username.trim().toLowerCase() });
      if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({
      email,
      username: username ? username.trim().toLowerCase() : undefined,
      password,
      fullName,
      role: role || 'resident',
      barangay: barangay || '',
      cityMunicipality: cityMunicipality || '',
      province: province || '',
      region: region || '',
    });
    const token = generateToken(user._id);
    const u = await User.findById(user._id).select('-password');
    res.status(201).json({ token, user: u });
  } catch (err) {
    console.error('POST /api/auth/register', err.message || err);
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email : String(body.email || '');
    const password = typeof body.password === 'string' ? body.password : (body.password != null ? String(body.password) : '');
    const loginId = email.trim().toLowerCase();
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid username/email or password' });
    if (!user.password) {
      console.error('Login: user has no password field', user._id);
      return res.status(500).json({ message: 'Account configuration error' });
    }
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid username/email or password' });

    const token = generateToken(user._id);
    const u = await User.findById(user._id).select('-password').lean();
    try {
      logActivity(req, { action: 'login', resource: 'auth', details: { userId: user._id.toString() }, user: u });
    } catch (_) {
      // do not fail login if activity logging fails
    }
    res.json({ token, user: u });
  } catch (err) {
    console.error('Login error:', err.message || err);
    console.error(err.stack);
    const status = err.message === 'JWT_SECRET is not configured' ? 503 : 500;
    res.status(status).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
