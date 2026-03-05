import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const roleLabel = {
  resident: 'Resident',
  encoder: 'Barangay Encoder',
  secretary: 'Barangay Secretary',
  punong_barangay: 'Punong Barangay',
  viewer: 'Viewer (SK)',
  admin: 'Admin',
};

const navItems = (user) => {
  const items = [
    { to: '/', label: 'Dashboard' },
    { to: '/households', label: 'Households' },
    { to: '/form-b', label: 'Form B' },
  ];
  if (user?.role === 'resident') {
    items.push({ to: '/digital-id', label: 'Digital ID' });
  }
  if (['secretary', 'punong_barangay', 'viewer'].includes(user?.role)) {
    items.push({ to: '/reports', label: 'Reports' });
  }
  return items;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <motion.header
        className="nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <NavLink to="/" className="nav-brand">
          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            RBI
          </motion.span>
        </NavLink>

        <nav className="nav-links">
          {navItems(user).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      className="nav-link-indicator"
                      layoutId="navIndicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="nav-right">
          <span className="nav-user">
            {user?.fullName} <span className="nav-role">({roleLabel[user?.role] || user?.role})</span>
          </span>
          <motion.button
            type="button"
            className="btn btn-outline btn-logout"
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Logout
          </motion.button>
        </div>
      </motion.header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="container"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
