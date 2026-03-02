import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    resident: 'Resident',
    encoder: 'Barangay Encoder',
    secretary: 'Barangay Secretary',
    punong_barangay: 'Punong Barangay',
  };

  return (
    <>
      <nav className="nav">
        <NavLink to="/" className="nav-brand">RBI</NavLink>
        <div className="nav-links">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/households">Households</NavLink>
          <NavLink to="/form-b">Form B</NavLink>
          {user?.role === 'resident' && (
            <NavLink to="/digital-id">Digital ID</NavLink>
          )}
          {['secretary', 'punong_barangay'].includes(user?.role) && (
            <NavLink to="/reports">Reports</NavLink>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {user?.fullName} ({roleLabel[user?.role] || user?.role})
          </span>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main className="container" style={{ paddingTop: '1.5rem' }}>
        <Outlet />
      </main>
    </>
  );
}
