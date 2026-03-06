import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

ChartJS.register(ArcElement, Tooltip, Legend);

const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];

const roleLabel = {
  resident: 'Resident',
  encoder: 'Barangay Encoder',
  secretary: 'Barangay Secretary',
  punong_barangay: 'Punong Barangay',
  viewer: 'Viewer (SK)',
  admin: 'Admin',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const IconHousehold = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconForm = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconId = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
    <line x1="7" y1="10" x2="17" y2="10" />
    <line x1="7" y1="14" x2="13" y2="14" />
  </svg>
);
const IconVerify = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconReports = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconAdd = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
function getHeroContent(role) {
  switch (role) {
    case 'resident':
      return {
        title: 'Welcome to RBI',
        subtitle: 'Manage your household data, Form B records, and access your Barangay Digital ID in one place.',
      };
    case 'encoder':
      return {
        title: 'Barangay Encoder',
        subtitle: 'Register households, maintain Form B records, and keep barangay data up to date.',
      };
    case 'secretary':
    case 'punong_barangay':
      return {
        title: 'Barangay Dashboard',
        subtitle: 'Overview of registrations, reports, and barangay information at a glance.',
      };
    case 'viewer':
      return {
        title: 'RBI Viewer',
        subtitle: 'Browse households, Form B records, and barangay reports.',
      };
    case 'admin':
      return {
        title: 'Admin Dashboard',
        subtitle: 'Manage all RBI data, users, and barangay records.',
      };
    default:
      return {
        title: 'Welcome back',
        subtitle: 'Access your barangay information and services here.',
      };
  }
}

function getGridTiles(user) {
  const role = user?.role;
  const tiles = [];

  if (role === 'resident') {
    tiles.push({ to: '/households', label: 'Households', icon: IconHousehold, accent: false });
    tiles.push({ to: '/form-b', label: 'Form B', icon: IconForm, accent: false });
    tiles.push({ to: '/digital-id', label: 'Digital ID', icon: IconId, accent: true });
    tiles.push({ to: '/verify', label: 'Verify ID', icon: IconVerify, accent: false });
    return tiles;
  }

  if (staffRoles.includes(role) || role === 'admin') {
    tiles.push({ to: '/households', label: 'Households', icon: IconHousehold, accent: false });
    tiles.push({ to: '/form-b', label: 'Form B', icon: IconForm, accent: false });
    if (role !== 'viewer') {
      tiles.push({ to: '/households/new', label: 'New Household', icon: IconAdd, accent: true });
      tiles.push({ to: '/form-b/new', label: 'New Form B', icon: IconAdd, accent: true });
    }
    if (['secretary', 'punong_barangay', 'viewer', 'admin'].includes(role)) {
      tiles.push({ to: '/reports', label: 'Reports', icon: IconReports, accent: false });
    }
  }

  if (tiles.length === 0) {
    tiles.push({ to: '/households', label: 'Households', icon: IconHousehold, accent: false });
    tiles.push({ to: '/form-b', label: 'Form B', icon: IconForm, accent: false });
  }
  return tiles;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [hasDigitalId, setHasDigitalId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);

  const isStaff = user && staffRoles.includes(user.role);

  useEffect(() => {
    if (user?.role !== 'resident') return;
    client.get('/resident-card').then((res) => setHasDigitalId(res.data?.eligible === true)).catch(() => setHasDigitalId(false));
  }, [user?.role]);

  useEffect(() => {
    if (!isStaff) return;
    client.get('/reports/dashboard').then((res) => setDashboardData(res.data)).catch((err) => setDashboardError(err.response?.data?.message || 'Failed to load dashboard'));
  }, [isStaff]);

  const hero = getHeroContent(user?.role);
  const gridTiles = getGridTiles(user);

  const chartData = dashboardData?.bySex
    ? {
        labels: ['Male', 'Female', 'Other'],
        datasets: [{ data: [dashboardData.bySex.male, dashboardData.bySex.female, dashboardData.bySex.other], backgroundColor: ['#333366', '#FF9933', '#000000'], borderWidth: 0 }],
      }
    : null;

  const recentRegistrations = dashboardData?.recentRegistrations || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.section className="dashboard-hero" variants={item}>
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
      </motion.section>

      <motion.div className="dashboard-grid" variants={container}>
        {gridTiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.to + i} to={tile.to} className="dashboard-tile">
              <motion.span className={`dashboard-tile-icon ${tile.accent ? 'accent' : ''}`} variants={item}>
                <Icon />
              </motion.span>
              <span>{tile.label}</span>
            </Link>
          );
        })}
      </motion.div>

      {user?.role === 'resident' && (
        <motion.div className="dashboard-explore-wrap" variants={item}>
          <h2>Quick access</h2>
          <div className="dashboard-explore">
            {hasDigitalId === true && (
              <Link to="/digital-id" className="dashboard-explore-card">
                <h3>Your Digital ID</h3>
                <p>View and use your Barangay Digital ID for services.</p>
              </Link>
            )}
            <Link to="/verify" className="dashboard-explore-card">
              <h3>Verify a resident ID</h3>
              <p>Check validity of a Barangay ID number.</p>
            </Link>
            <Link to="/households" className="dashboard-explore-card">
              <h3>Households</h3>
              <p>View and manage your household record.</p>
            </Link>
            <Link to="/form-b" className="dashboard-explore-card">
              <h3>Form B</h3>
              <p>Access your Form B (resident) records.</p>
            </Link>
          </div>
        </motion.div>
      )}

      {user?.role === 'resident' && hasDigitalId === false && (
        <motion.div className="card card-highlight" variants={item}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Complete your household form and get it validated to receive your Barangay Digital ID for benefits and services.
          </p>
        </motion.div>
      )}

      {isStaff && (
        <>
          {dashboardError && (
            <motion.div className="card card-error" variants={item}>
              {dashboardError}
            </motion.div>
          )}

          {dashboardData && (
            <>
              <motion.div className="dashboard-section" variants={item}>
                <h2>Summary</h2>
                <div className="dashboard-stats-row">
                  <div className="dashboard-stat-box">
                    <span className="value">{dashboardData.totalHouseholds}</span>
                    <span className="label">Total Households</span>
                  </div>
                  <div className="dashboard-stat-box">
                    <span className="value">{dashboardData.totalInhabitants}</span>
                    <span className="label">Total Residents</span>
                  </div>
                  <div className="dashboard-stat-box">
                    <span className="value">
                      {dashboardData.bySex?.male ?? 0} / {dashboardData.bySex?.female ?? 0}
                    </span>
                    <span className="label">Male / Female</span>
                  </div>
                </div>
              </motion.div>

              {chartData && (
                <motion.div className="card card-chart dashboard-section" variants={item}>
                  <h2 className="card-heading">Population by gender</h2>
                  <div className="chart-wrap">
                    <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
                  </div>
                </motion.div>
              )}

              {recentRegistrations.length > 0 && (
                <motion.div className="dashboard-explore-wrap" variants={item}>
                  <h2>Recent registrations</h2>
                  <div className="dashboard-explore">
                    {recentRegistrations.slice(0, 6).map((h) => (
                      <Link key={h._id} to={`/households/${h._id}`} className="dashboard-explore-card">
                        <h3>{h.householdNumber || 'No number'}</h3>
                        <p>{h.householdAddress || 'No address'} · {h.numberOfMembers} members</p>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
