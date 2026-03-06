import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import client from '../api/client';

ChartJS.register(ArcElement, Tooltip, Legend);

const tabVariants = {
  inactive: { opacity: 0.7 },
  active: { opacity: 1 },
};

const cardItem = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.03 * i } }),
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seniorList, setSeniorList] = useState(null);
  const [pwdListData, setPwdListData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    client
      .get('/reports/summary')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'senior') {
      client.get('/reports/senior-citizens').then((res) => setSeniorList(res.data)).catch(() => setSeniorList({ list: [] }));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'pwd') {
      client.get('/reports/pwd-list').then((res) => setPwdListData(res.data)).catch(() => setPwdListData({ list: [] }));
    }
  }, [activeTab]);

  const downloadExport = (format) => {
    setExporting(format);
    const url = `/api/reports/export/${format}`;
    const token = localStorage.getItem('rbi_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `rbi-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert('Export failed'))
      .finally(() => setExporting(''));
  };

  const name = (r) => [r.lastName, r.firstName, r.middleName, r.nameExtension].filter(Boolean).join(' ') || '—';

  if (loading) {
    return (
      <div className="loading-pulse" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading report...
      </div>
    );
  }
  if (error) {
    return <p className="error-msg" style={{ margin: '2rem 0' }}>{error}</p>;
  }
  if (!data) return null;

  const chartData = data.bySex
    ? {
        labels: ['Male', 'Female', 'Other'],
        datasets: [
          {
            data: [data.bySex.male || 0, data.bySex.female || 0, data.bySex.other || 0],
            backgroundColor: ['#333366', '#FF9933', '#000000'],
            borderWidth: 0,
          },
        ],
      }
    : null;

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'senior', label: 'Senior citizens (60+)' },
    { id: 'pwd', label: 'PWD list' },
  ];

  const summaryStats = [
    { label: 'Total households', value: data.totalHouseholds },
    { label: 'Total inhabitants', value: data.totalInhabitants },
    { label: 'Male', value: data.bySex?.male ?? 0 },
    { label: 'Female', value: data.bySex?.female ?? 0 },
    { label: 'Other', value: data.bySex?.other ?? 0 },
    { label: 'Senior citizens (60+)', value: data.seniorCount ?? 0 },
    { label: 'Age 0-17', value: data.byAgeGroup?.['0-17'] ?? 0 },
    { label: 'Age 18-59', value: data.byAgeGroup?.['18-59'] ?? 0 },
    { label: 'Age 60+', value: data.byAgeGroup?.['60+'] ?? 0 },
    { label: 'Draft', value: data.byStatus?.draft ?? 0 },
    { label: 'Submitted', value: data.byStatus?.submitted ?? 0 },
    { label: 'Certified', value: data.byStatus?.certified ?? 0 },
    { label: 'Validated', value: data.byStatus?.validated ?? 0 },
    { label: 'PWD', value: data.isPWD ?? 0 },
    { label: 'OFW', value: data.isOFW ?? 0 },
    { label: 'Solo parent', value: data.isSoloParent ?? 0 },
    { label: 'OSY', value: data.isOSY ?? 0 },
    { label: 'OSC', value: data.isOSC ?? 0 },
    { label: 'IP', value: data.isIP ?? 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Summary and lists for your barangay.</p>
      </div>

      <div className="reports-toolbar">
        <div className="reports-tabs">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`btn ${activeTab === tab.id ? '' : 'btn-outline'} reports-tab`}
              onClick={() => setActiveTab(tab.id)}
              variants={tabVariants}
              animate={activeTab === tab.id ? 'active' : 'inactive'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
        <div className="reports-export">
          <motion.button
            type="button"
            className="btn btn-outline"
            disabled={!!exporting}
            onClick={() => downloadExport('pdf')}
            whileTap={{ scale: 0.98 }}
          >
            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </motion.button>
          <motion.button
            type="button"
            className="btn btn-outline"
            disabled={!!exporting}
            onClick={() => downloadExport('excel')}
            whileTap={{ scale: 0.98 }}
          >
            {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
          </motion.button>
        </div>
      </div>

      {activeTab === 'summary' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="card-heading">Summary</h2>
          <motion.div
            className="grid-2"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
          >
            {summaryStats.map((stat, i) => (
              <motion.div key={stat.label} className="stat-card" variants={cardItem} custom={i}>
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
          {chartData && (
            <div className="card-chart" style={{ maxWidth: 280, marginTop: '1.5rem' }}>
              <h3 className="card-heading">Population by gender</h3>
              <Doughnut data={chartData} options={{ responsive: true }} />
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'senior' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="card-heading">Senior citizens (60+)</h2>
          {seniorList === null ? (
            <div className="loading-pulse" style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
          ) : !seniorList.list?.length ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No senior citizens found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Sex</th>
                    <th>Address</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {seniorList.list.map((r) => (
                    <tr key={r._id}>
                      <td>{name(r)}</td>
                      <td>{r.age ?? '—'}</td>
                      <td>{r.sex || '—'}</td>
                      <td>{r.residenceAddress || '—'}</td>
                      <td>{r.contactNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {seniorList && <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.9rem' }}>Total: {seniorList.total ?? 0}</p>}
        </motion.div>
      )}

      {activeTab === 'pwd' && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="card-heading">PWD list</h2>
          {pwdListData === null ? (
            <div className="loading-pulse" style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
          ) : !pwdListData.list?.length ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No PWD records found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Sex</th>
                    <th>Address</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {pwdListData.list.map((r) => (
                    <tr key={r._id}>
                      <td>{name(r)}</td>
                      <td>{r.age ?? '—'}</td>
                      <td>{r.sex || '—'}</td>
                      <td>{r.residenceAddress || '—'}</td>
                      <td>{r.contactNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pwdListData && <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.9rem' }}>Total: {pwdListData.total ?? 0}</p>}
        </motion.div>
      )}
    </motion.div>
  );
}
