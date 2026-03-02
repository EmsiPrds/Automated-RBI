import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'resident', label: 'Resident / Household Head' },
  { value: 'encoder', label: 'Barangay Encoder' },
  { value: 'secretary', label: 'Barangay Secretary' },
  { value: 'punong_barangay', label: 'Punong Barangay' },
];

export default function Register() {
  const [form, setForm] = useState({
    email: '',
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

  const isStaff = ['encoder', 'secretary', 'punong_barangay'].includes(form.role);

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: '2rem' }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Create account</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password (min 6 characters)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {isStaff && (
            <>
              <div className="form-group">
                <label>Region</label>
                <input value={form.region} onChange={(e) => update('region', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Province</label>
                <input value={form.province} onChange={(e) => update('province', e.target.value)} />
              </div>
              <div className="form-group">
                <label>City / Municipality</label>
                <input value={form.cityMunicipality} onChange={(e) => update('cityMunicipality', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Barangay (assigned area)</label>
                <input value={form.barangay} onChange={(e) => update('barangay', e.target.value)} />
              </div>
            </>
          )}
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login">Already have an account? Sign in</Link>
        </p>
      </div>
    </div>
  );
}
