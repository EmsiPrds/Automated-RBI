import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function HouseholdList() {
  const [list, setList] = useState({ households: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = { page, limit: 15 };
    if (status) params.status = status;
    client.get('/households', { params })
      .then((res) => setList(res.data))
      .catch(() => setList({ households: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [page, status]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Households</h1>
        <Link to="/households/new" className="btn btn-success">New household</Link>
      </div>
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
        ) : list.households.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No households found.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Household no.</th>
                    <th>Address</th>
                    <th>Barangay</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.households.map((h) => (
                    <tr key={h._id}>
                      <td>{h.householdNumber || '—'}</td>
                      <td>{h.householdAddress || '—'}</td>
                      <td>{h.barangay || '—'}</td>
                      <td>{h.numberOfMembers ?? 0}</td>
                      <td><span className={`badge badge-${h.status}`}>{h.status}</span></td>
                      <td>
                        <Link to={`/households/${h._id}`} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem' }}>View</Link>
                        {h.status === 'draft' && (
                          <Link to={`/households/${h._id}/edit`} className="btn btn-outline" style={{ marginLeft: '0.5rem', padding: '0.35rem 0.75rem' }}>Edit</Link>
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
