import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  if (loading) {
    return (
      <div className="loading-pulse" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }
  if (!household) {
    return <p className="error-msg">Household not found.</p>;
  }

  const canEdit = household.status === 'draft' && user?.role !== 'viewer';
  const canSubmit = household.status === 'draft' && (user?.role === 'resident' || user?.role === 'encoder');
  const canCertify = household.status === 'submitted' && user?.role === 'secretary';
  const canValidate = household.status === 'certified' && user?.role === 'punong_barangay';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Household {household.householdNumber || '(no number)'}</h1>
          <p className="page-subtitle">
            <span className={`badge badge-${household.status}`}>{household.status}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit && <Link to={`/households/${id}/edit`} className="btn">Edit</Link>}
          {canSubmit && <motion.button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('submit')} whileTap={{ scale: 0.98 }}>Submit for certification</motion.button>}
          {canCertify && <motion.button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('certify')} whileTap={{ scale: 0.98 }}>Certify</motion.button>}
          {canValidate && <motion.button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('validate')} whileTap={{ scale: 0.98 }}>Validate</motion.button>}
          <motion.button type="button" className="btn btn-outline" onClick={() => navigate('/households')} whileTap={{ scale: 0.98 }}>Back to list</motion.button>
        </div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="card-heading">Location</h2>
        <div className="detail-grid">
          <p><strong>Region:</strong> {household.region || '—'}</p>
          <p><strong>Province:</strong> {household.province || '—'}</p>
          <p><strong>City/Municipality:</strong> {household.cityMunicipality || '—'}</p>
          <p><strong>Barangay:</strong> {household.barangay || '—'}</p>
          <p><strong>Household address:</strong> {household.householdAddress || '—'}</p>
          <p><strong>Head of household:</strong> {household.headOfFamily || '—'}</p>
          <p><strong>No. of members:</strong> {household.numberOfMembers ?? 0}</p>
          {household.dataSource && <p><strong>Data source:</strong> {household.dataSource}</p>}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 0, marginTop: '0.5rem' }}>Form B records for this household are updated automatically when you save.</p>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <h2 className="card-heading">Household members</h2>
        {!household.inhabitants?.length ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No members recorded.</p>
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
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <h2 className="card-heading">Certification</h2>
        <div className="detail-grid">
          <p><strong>Prepared by:</strong> {household.preparedBy || '—'} {household.preparedAt && `(${new Date(household.preparedAt).toLocaleString()})`}</p>
          <p><strong>Certified by:</strong> {household.certifiedBy?.fullName || '—'} {household.certifiedAt && `(${new Date(household.certifiedAt).toLocaleString()})`}</p>
          <p><strong>Validated by:</strong> {household.validatedBy?.fullName || '—'} {household.validatedAt && `(${new Date(household.validatedAt).toLocaleString()})`}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
