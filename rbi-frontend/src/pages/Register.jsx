import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'resident', label: 'Resident / Household Head' },
  { value: 'encoder', label: 'Barangay Encoder' },
  { value: 'secretary', label: 'Barangay Secretary' },
  { value: 'punong_barangay', label: 'Punong Barangay' },
  { value: 'viewer', label: 'Viewer (SK / read-only)' },
  { value: 'admin', label: 'Admin' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    role: 'resident',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isStaff = ['encoder', 'secretary', 'punong_barangay', 'viewer', 'admin'].includes(form.role);

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card-wrap auth-card-wrap-wide"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="auth-card">
          <h1 className="auth-title">Create account</h1>

          <motion.form
            onSubmit={handleSubmit}
            className="auth-form"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div className="form-group" variants={item}>
              <label>Full name</label>
              <input
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                required
                placeholder="Enter full name"
              />
            </motion.div>
            <motion.div className="form-group" variants={item}>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                placeholder="Enter email"
              />
            </motion.div>
            <motion.div className="form-group" variants={item}>
              <label>Username (optional; for login)</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                placeholder="Leave blank to use email only"
              />
            </motion.div>
            <motion.div className="form-group" variants={item}>
              <label>Password (min 6 characters)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={6}
                placeholder="Enter password"
              />
            </motion.div>
            <motion.div className="form-group" variants={item}>
              <label>Role</label>
              <select value={form.role} onChange={(e) => update('role', e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </motion.div>
            {isStaff && (
              <>
                <motion.div className="form-group" variants={item}>
                  <label>Region</label>
                  <input value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="Region" />
                </motion.div>
                <motion.div className="form-group" variants={item}>
                  <label>Province</label>
                  <input value={form.province} onChange={(e) => update('province', e.target.value)} placeholder="Province" />
                </motion.div>
                <motion.div className="form-group" variants={item}>
                  <label>City / Municipality</label>
                  <input value={form.cityMunicipality} onChange={(e) => update('cityMunicipality', e.target.value)} placeholder="City / Municipality" />
                </motion.div>
                <motion.div className="form-group" variants={item}>
                  <label>Barangay (assigned area)</label>
                  <input value={form.barangay} onChange={(e) => update('barangay', e.target.value)} placeholder="Barangay" />
                </motion.div>
              </>
            )}
            {error && <motion.p className="error-msg" variants={item}>{error}</motion.p>}
            <motion.button
              type="submit"
              className="btn btn-block"
              disabled={loading}
              variants={item}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? 'Creating...' : 'Create account'}
            </motion.button>
          </motion.form>

          <p className="auth-footer">
            <Link to="/login">Already have an account? Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
