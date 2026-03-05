import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function fullName(r) {
  return [r.lastName, r.firstName, r.middleName, r.nameExtension].filter(Boolean).join(' ') || '—';
}

const listItem = {
  hidden: { opacity: 0, y: 6 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.02 * i } }),
};

export default function FormBList() {
  const { user } = useAuth();
  const isStaff = ['encoder', 'secretary', 'punong_barangay'].includes(user?.role);
  const [list, setList] = useState({ records: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [philsys, setPhilsys] = useState('');
  const [address, setAddress] = useState('');
  const [householdNumber, setHouseholdNumber] = useState('');
  const [searchApplied, setSearchApplied] = useState({ search: '', philsys: '', address: '', householdNumber: '' });

  const applySearch = () => {
    setSearchApplied({ search, philsys, address, householdNumber });
    setPage(1);
  };

  useEffect(() => {
    const params = { page, limit: 15 };
    if (status) params.status = status;
    if (searchApplied.search) params.search = searchApplied.search;
    if (searchApplied.philsys) params.philsys = searchApplied.philsys;
    if (searchApplied.address) params.address = searchApplied.address;
    if (searchApplied.householdNumber) params.householdNumber = searchApplied.householdNumber;
    client.get('/form-b', { params })
      .then((res) => setList(res.data))
      .catch(() => setList({ records: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [page, status, searchApplied]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Form B (Individual records)</h1>
          <p className="page-subtitle">
            {user?.role === 'resident'
              ? 'Form B records are created from your household (Form A). Save or update your household to sync.'
              : 'Manage individual resident records.'}
          </p>
        </div>
        {isStaff && (
          <Link to="/form-b/new">
            <motion.span className="btn btn-success" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              New Form B
            </motion.span>
          </Link>
        )}
      </div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="filter-bar">
          <div className="form-group">
            <label>Search (name)</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Last, first, or middle name" style={{ minWidth: 160 }} />
          </div>
          <div className="form-group">
            <label>PhilSys number</label>
            <input value={philsys} onChange={(e) => setPhilsys(e.target.value)} placeholder="PhilSys no." style={{ width: 140 }} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Residence address" style={{ minWidth: 160 }} />
          </div>
          <div className="form-group">
            <label>Household number</label>
            <input value={householdNumber} onChange={(e) => setHouseholdNumber(e.target.value)} placeholder="Household no." style={{ width: 120 }} />
          </div>
          <motion.button type="button" className="btn" onClick={applySearch} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Search
          </motion.button>
          <div className="form-group" style={{ minWidth: 140 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="certified">Certified</option>
              <option value="validated">Validated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-pulse" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading...
          </div>
        ) : list.records.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0, padding: '1rem 0' }}>No Form B records found.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Barangay</th>
                    <th>Household no.</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((r, i) => (
                    <motion.tr key={r._id} variants={listItem} initial="hidden" animate="show" custom={i}>
                      <td>{fullName(r)}</td>
                      <td>{r.barangay || '—'}</td>
                      <td>{r.householdNumber || '—'}</td>
                      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      <td>
                        <Link to={`/form-b/${r._id}`} className="btn btn-outline btn-sm">View</Link>
                        {r.status === 'draft' && user?.role !== 'viewer' && (
                          <Link to={`/form-b/${r._id}/edit`} className="btn btn-outline btn-sm" style={{ marginLeft: '0.5rem' }}>Edit</Link>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.total > 15 && (
              <div className="pagination">
                <motion.button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} whileTap={{ scale: 0.98 }}>
                  Previous
                </motion.button>
                <span>Page {page} of {Math.ceil(list.total / 15)}</span>
                <motion.button type="button" className="btn btn-outline" disabled={page >= Math.ceil(list.total / 15)} onClick={() => setPage((p) => p + 1)} whileTap={{ scale: 0.98 }}>
                  Next
                </motion.button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
