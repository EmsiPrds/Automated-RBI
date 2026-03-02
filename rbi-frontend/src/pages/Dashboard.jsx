import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [hasDigitalId, setHasDigitalId] = useState(null);
  const roleLabel = {
    resident: 'Resident',
    encoder: 'Barangay Encoder',
    secretary: 'Barangay Secretary',
    punong_barangay: 'Punong Barangay',
  };

  useEffect(() => {
    if (user?.role !== 'resident') return;
    client
      .get('/resident-card')
      .then((res) => setHasDigitalId(res.data?.eligible === true))
      .catch(() => setHasDigitalId(false));
  }, [user?.role]);

  return (
    <>
      <h1>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Welcome, {user?.fullName}. You are logged in as <strong>{roleLabel[user?.role]}</strong>.
      </p>
      {user?.role === 'resident' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          {hasDigitalId === true ? (
            <p style={{ margin: 0 }}>
              <Link to="/digital-id" className="btn btn-success">View your Digital ID</Link>
              <span style={{ marginLeft: '0.75rem', color: 'var(--text-muted)' }}>
                Use it to claim benefits and access barangay services.
              </span>
            </p>
          ) : hasDigitalId === false && (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Complete your household form and get it validated to receive your Barangay Digital ID for benefits and services.
            </p>
          )}
        </div>
      )}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Quick actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/households" className="btn">View households</Link>
          <Link to="/households/new" className="btn btn-success">New household (Form A)</Link>
          <Link to="/form-b" className="btn">View Form B</Link>
          <Link to="/form-b/new" className="btn btn-success">New Form B</Link>
          {['secretary', 'punong_barangay'].includes(user?.role) && (
            <Link to="/reports" className="btn btn-secondary">Reports</Link>
          )}
        </div>
      </div>
    </>
  );
}
