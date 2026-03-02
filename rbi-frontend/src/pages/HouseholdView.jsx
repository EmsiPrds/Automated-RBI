import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const SEX = ['Male', 'Female', 'Other'];
const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Common Law', 'Unknown'];

export default function HouseholdView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    client.get(`/households/${id}`)
      .then((res) => setHousehold(res.data))
      .catch(() => setHousehold(null))
      .finally(() => setLoading(false));
  }, [id]);

  const doAction = (action) => {
    setActionLoading(true);
    client.patch(`/households/${id}/${action}`, action === 'submit' ? { preparedBy: user?.fullName } : {})
      .then((res) => setHousehold(res.data))
      .finally(() => setActionLoading(false));
  };

  if (loading) return <p>Loading...</p>;
  if (!household) return <p>Household not found.</p>;

  const canEdit = household.status === 'draft';
  const canSubmit = household.status === 'draft' && (user?.role === 'resident' || user?.role === 'encoder');
  const canCertify = household.status === 'submitted' && user?.role === 'secretary';
  const canValidate = household.status === 'certified' && user?.role === 'punong_barangay';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Household {household.householdNumber || '(no number)'}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit && <Link to={`/households/${id}/edit`} className="btn">Edit</Link>}
          {canSubmit && <button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('submit')}>Submit for certification</button>}
          {canCertify && <button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('certify')}>Certify</button>}
          {canValidate && <button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('validate')}>Validate</button>}
          <button type="button" className="btn btn-outline" onClick={() => navigate('/households')}>Back to list</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Location</h2>
        <p><strong>Region:</strong> {household.region || '—'}</p>
        <p><strong>Province:</strong> {household.province || '—'}</p>
        <p><strong>City/Municipality:</strong> {household.cityMunicipality || '—'}</p>
        <p><strong>Barangay:</strong> {household.barangay || '—'}</p>
        <p><strong>Household address:</strong> {household.householdAddress || '—'}</p>
        <p><strong>No. of members:</strong> {household.numberOfMembers ?? 0}</p>
        {household.dataSource && <p><strong>Data source:</strong> {household.dataSource}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 0 }}>Form B records for this household are updated automatically when you save.</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Household members</h2>
        {!household.inhabitants?.length ? (
          <p style={{ color: 'var(--text-muted)' }}>No members recorded.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Place of birth</th>
                  <th>DOB</th>
                  <th>Age</th>
                  <th>Sex</th>
                  <th>Civil status</th>
                  <th>Citizenship</th>
                  <th>Occupation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {household.inhabitants.map((inv, i) => (
                  <tr key={inv._id || i}>
                    <td>{[inv.lastName, inv.firstName, inv.middleName, inv.nameExtension].filter(Boolean).join(' ')}</td>
                    <td>{inv.placeOfBirth || '—'}</td>
                    <td>{inv.dateOfBirth ? new Date(inv.dateOfBirth).toLocaleDateString() : '—'}</td>
                    <td>{inv.age ?? '—'}</td>
                    <td>{inv.sex || '—'}</td>
                    <td>{inv.civilStatus || '—'}</td>
                    <td>{inv.citizenship || '—'}</td>
                    <td>{inv.occupation || '—'}</td>
                    <td>
                      {[
                        inv.isLaborEmployed && 'Labor',
                        inv.isUnemployed && 'Unemployed',
                        inv.isPWD && 'PWD',
                        inv.isOFW && 'OFW',
                        inv.isSoloParent && 'Solo Parent',
                        inv.isOSY && 'OSY',
                        inv.isOSC && 'OSC',
                        inv.isIP && 'IP',
                      ].filter(Boolean).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Certification</h2>
        <p><strong>Prepared by:</strong> {household.preparedBy || '—'} {household.preparedAt && `(${new Date(household.preparedAt).toLocaleString()})`}</p>
        <p><strong>Certified by:</strong> {household.certifiedBy?.fullName || '—'} {household.certifiedAt && `(${new Date(household.certifiedAt).toLocaleString()})`}</p>
        <p><strong>Validated by:</strong> {household.validatedBy?.fullName || '—'} {household.validatedAt && `(${new Date(household.validatedAt).toLocaleString()})`}</p>
      </div>
    </>
  );
}
