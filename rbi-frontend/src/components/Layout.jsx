import React, { useState, useEffect } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <motion.header
        className="nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <button
          type="button"
          className="nav-menu-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <NavLink to="/" className="nav-brand" onClick={closeMenu}>
          <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            RBI
          </motion.span>
        </NavLink>
        <div
          className={`nav-overlay ${menuOpen ? 'is-open' : ''}`}
          onClick={closeMenu}
          aria-hidden
        />
        <div className={`nav-menu ${menuOpen ? 'is-open' : ''}`}>
          <nav className="nav-links">
            {navItems(user).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                onClick={closeMenu}
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
