import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function fullName(r) {
  return [r.lastName, r.firstName, r.middleName, r.nameExtension].filter(Boolean).join(' ') || '—';
}

export default function FormBList() {
  const { user } = useAuth();
  const isStaff = ['encoder', 'secretary', 'punong_barangay'].includes(user?.role);
  const [list, setList] = useState({ records: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = { page, limit: 15 };
    if (status) params.status = status;
    client.get('/form-b', { params })
      .then((res) => setList(res.data))
      .catch(() => setList({ records: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [page, status]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Form B (Individual records)</h1>
        {isStaff && <Link to="/form-b/new" className="btn btn-success">New Form B</Link>}
      </div>
      {user?.role === 'resident' && (
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Form B records are created from your household (Form A). Save or update your household to sync.
        </p>
      )}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-group" style={{ marginBottom: 0, width: 'auto' }}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="certified">Certified</option>
            <option value="validated">Validated</option>
          </select>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : list.records.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No Form B records found.</p>
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
                  {list.records.map((r) => (
                    <tr key={r._id}>
                      <td>{fullName(r)}</td>
                      <td>{r.barangay || '—'}</td>
                      <td>{r.householdNumber || '—'}</td>
                      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      <td>
                        <Link to={`/form-b/${r._id}`} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem' }}>View</Link>
                        {r.status === 'draft' && (
                          <Link to={`/form-b/${r._id}/edit`} className="btn btn-outline" style={{ marginLeft: '0.5rem', padding: '0.35rem 0.75rem' }}>Edit</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.total > 15 && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span>Page {page} of {Math.ceil(list.total / 15)}</span>
                <button type="button" className="btn btn-outline" disabled={page >= Math.ceil(list.total / 15)} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
