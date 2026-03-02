import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/reports/summary')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading report...</p>;
  if (error) return <p className="error-msg">{error}</p>;
  if (!data) return null;

  return (
    <>
      <h1>Reports</h1>
      <p style={{ color: 'var(--text-muted)' }}>Summary counts for your barangay.</p>
      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <div className="stat-card">
          <h3>{data.totalHouseholds}</h3>
          <p>Total households</p>
        </div>
        <div className="stat-card">
          <h3>{data.totalInhabitants}</h3>
          <p>Total inhabitants</p>
        </div>
        <div className="stat-card">
          <h3>{data.byStatus?.draft ?? 0}</h3>
          <p>Draft</p>
        </div>
        <div className="stat-card">
          <h3>{data.byStatus?.submitted ?? 0}</h3>
          <p>Submitted</p>
        </div>
        <div className="stat-card">
          <h3>{data.byStatus?.certified ?? 0}</h3>
          <p>Certified</p>
        </div>
        <div className="stat-card">
          <h3>{data.byStatus?.validated ?? 0}</h3>
          <p>Validated</p>
        </div>
        <div className="stat-card">
          <h3>{data.isPWD ?? 0}</h3>
          <p>PWD</p>
        </div>
        <div className="stat-card">
          <h3>{data.isOFW ?? 0}</h3>
          <p>OFW</p>
        </div>
        <div className="stat-card">
          <h3>{data.isSoloParent ?? 0}</h3>
          <p>Solo parent</p>
        </div>
        <div className="stat-card">
          <h3>{data.isOSY ?? 0}</h3>
          <p>OSY</p>
        </div>
        <div className="stat-card">
          <h3>{data.isOSC ?? 0}</h3>
          <p>OSC</p>
        </div>
        <div className="stat-card">
          <h3>{data.isIP ?? 0}</h3>
          <p>IP</p>
        </div>
      </div>
    </>
  );
}
