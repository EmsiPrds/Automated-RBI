import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

ChartJS.register(ArcElement, Tooltip, Legend);

const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [hasDigitalId, setHasDigitalId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);

  const roleLabel = {
    resident: 'Resident',
    encoder: 'Barangay Encoder',
    secretary: 'Barangay Secretary',
    punong_barangay: 'Punong Barangay',
    viewer: 'Viewer (SK)',
    admin: 'Admin',
  };

  const isStaff = user && staffRoles.includes(user.role);

  useEffect(() => {
    if (user?.role !== 'resident') return;
    client
      .get('/resident-card')
      .then((res) => setHasDigitalId(res.data?.eligible === true))
      .catch(() => setHasDigitalId(false));
  }, [user?.role]);

  useEffect(() => {
    if (!isStaff) return;
    client
      .get('/reports/dashboard')
      .then((res) => setDashboardData(res.data))
      .catch((err) => setDashboardError(err.response?.data?.message || 'Failed to load dashboard'));
  }, [isStaff]);

  const chartData = dashboardData?.bySex
    ? {
        labels: ['Male', 'Female', 'Other'],
        datasets: [
          {
            data: [dashboardData.bySex.male, dashboardData.bySex.female, dashboardData.bySex.other],
            backgroundColor: ['#2563eb', '#ec4899', '#94a3b8'],
            borderWidth: 0,
          },
        ],
      }
    : null;

  const totalForRatio = dashboardData
    ? (dashboardData.bySex?.male || 0) + (dashboardData.bySex?.female || 0) + (dashboardData.bySex?.other || 0)
    : 0;
  const maleRatio = totalForRatio > 0 ? ((dashboardData?.bySex?.male || 0) / totalForRatio * 100).toFixed(1) : '0';
  const femaleRatio = totalForRatio > 0 ? ((dashboardData?.bySex?.female || 0) / totalForRatio * 100).toFixed(1) : '0';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="page-header" variants={item}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome, {user?.fullName}. You are logged in as <strong>{roleLabel[user?.role]}</strong>.
        </p>
      </motion.div>

      {user?.role === 'resident' && (
        <motion.div className="card card-highlight" variants={item}>
          {hasDigitalId === true ? (
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/digital-id">
                <motion.span
                  className="btn btn-success"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View your Digital ID
                </motion.span>
              </Link>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                Use it to claim benefits and access barangay services.
              </span>
            </p>
          ) : hasDigitalId === false ? (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Complete your household form and get it validated to receive your Barangay Digital ID for benefits and services.
            </p>
          ) : null}
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
              <motion.div className="card" variants={item}>
                <h2 className="card-heading">Summary</h2>
                <motion.div
                  className="dashboard-stats"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div className="stat-card" variants={item}>
                    <span className="stat-value">{dashboardData.totalHouseholds}</span>
                    <span className="stat-label">Total Households</span>
                  </motion.div>
                  <motion.div className="stat-card" variants={item}>
                    <span className="stat-value">{dashboardData.totalInhabitants}</span>
                    <span className="stat-label">Total Residents</span>
                  </motion.div>
                  <motion.div className="stat-card" variants={item}>
                    <span className="stat-value">{maleRatio}% / {femaleRatio}%</span>
                    <span className="stat-label">Male / Female ratio</span>
                  </motion.div>
                </motion.div>
              </motion.div>
              {chartData && (
                <motion.div className="card card-chart" variants={item}>
                  <h2 className="card-heading">Population by gender</h2>
                  <div className="chart-wrap">
                    <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
                  </div>
                </motion.div>
              )}
              {dashboardData.recentRegistrations?.length > 0 && (
                <motion.div className="card" variants={item}>
                  <h2 className="card-heading">Recent registrations</h2>
                  <ul className="list-plain">
                    {dashboardData.recentRegistrations.map((h, i) => (
                      <motion.li
                        key={h._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="list-item-link"
                      >
                        <Link to={`/households/${h._id}`}>
                          {h.householdNumber || 'No number'} – {h.householdAddress || 'No address'} ({h.numberOfMembers} members)
                        </Link>
                        <span className="list-meta">
                          {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </>
          )}
        </>
      )}

      <motion.div className="card" variants={item}>
        <h2 className="card-heading">Quick actions</h2>
        <div className="quick-actions">
          <Link to="/households">
            <motion.span className="btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>View households</motion.span>
          </Link>
          {user?.role !== 'viewer' && (
            <>
              <Link to="/households/new">
                <motion.span className="btn btn-success" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>New household (Form A)</motion.span>
              </Link>
              <Link to="/form-b/new">
                <motion.span className="btn btn-success" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>New Form B</motion.span>
              </Link>
            </>
          )}
          <Link to="/form-b">
            <motion.span className="btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>View Form B</motion.span>
          </Link>
          {['secretary', 'punong_barangay', 'viewer'].includes(user?.role) && (
            <Link to="/reports">
              <motion.span className="btn btn-secondary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Reports</motion.span>
            </Link>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
