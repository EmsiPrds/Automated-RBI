import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function fullName(r) {
  return [r.lastName, r.firstName, r.middleName, r.nameExtension].filter(Boolean).join(' ') || '—';
}

export default function FormBView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    client.get(`/form-b/${id}`)
      .then((res) => setRecord(res.data))
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [id]);

  const doAction = (action) => {
    setActionLoading(true);
    client.patch(`/form-b/${id}/${action}`, action === 'submit' ? { preparedBy: user?.fullName } : {})
      .then((res) => setRecord(res.data))
      .finally(() => setActionLoading(false));
  };

  if (loading) return <p>Loading...</p>;
  if (!record) return <p>Form B record not found.</p>;

  const canEdit = record.status === 'draft';
  const canSubmit = record.status === 'draft' && (user?.role === 'resident' || user?.role === 'encoder');
  const canCertify = record.status === 'submitted' && user?.role === 'secretary';
  const canValidate = record.status === 'certified' && user?.role === 'punong_barangay';

  const flags = [
    record.isLaborEmployed && 'Labor',
    record.isUnemployed && 'Unemployed',
    record.isPWD && 'PWD',
    record.isOFW && 'OFW',
    record.isSoloParent && 'Solo Parent',
    record.isOSY && 'OSY',
    record.isOSC && 'OSC',
    record.isIP && 'IP',
  ].filter(Boolean);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Form B: {fullName(record)}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit && <Link to={`/form-b/${id}/edit`} className="btn">Edit</Link>}
          {canSubmit && <button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('submit')}>Submit for certification</button>}
          {canCertify && <button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('certify')}>Certify</button>}
          {canValidate && <button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('validate')}>Validate</button>}
          <button type="button" className="btn btn-outline" onClick={() => navigate('/form-b')}>Back to list</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Location</h2>
        <p><strong>Region:</strong> {record.region || '—'}</p>
        <p><strong>Province:</strong> {record.province || '—'}</p>
        <p><strong>City/Municipality:</strong> {record.cityMunicipality || '—'}</p>
        <p><strong>Barangay:</strong> {record.barangay || '—'}</p>
        <p><strong>Residence address:</strong> {record.residenceAddress || '—'}</p>
        <p><strong>Household number:</strong> {record.householdNumber || '—'}</p>
        {record.dataSource && <p><strong>Data source:</strong> {record.dataSource}</p>}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Personal information</h2>
        <p><strong>PhiSys Card No.:</strong> {record.philSysCardNo || '—'}</p>
        <p><strong>Last name:</strong> {record.lastName || '—'}</p>
        <p><strong>First name:</strong> {record.firstName || '—'}</p>
        <p><strong>Middle name:</strong> {record.middleName || '—'}</p>
        <p><strong>Name extension:</strong> {record.nameExtension || '—'}</p>
        <p><strong>Date of birth:</strong> {record.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString() : '—'}</p>
        <p><strong>Place of birth:</strong> {record.placeOfBirth || '—'}</p>
        <p><strong>Age:</strong> {record.age ?? '—'}</p>
        <p><strong>Sex:</strong> {record.sex || '—'}</p>
        <p><strong>Civil status:</strong> {record.civilStatus || '—'}</p>
        <p><strong>Religion:</strong> {record.religion || '—'}</p>
        <p><strong>Citizenship:</strong> {record.citizenship || '—'}</p>
        <p><strong>Occupation:</strong> {record.occupation || '—'}</p>
        <p><strong>Contact number:</strong> {record.contactNumber || '—'}</p>
        <p><strong>Email:</strong> {record.email || '—'}</p>
        <p><strong>Highest educational attainment:</strong> {record.highestEducationalAttainment || '—'} {record.graduateOrUndergraduate ? `(${record.graduateOrUndergraduate})` : ''}</p>
        {record.courseSpecification && <p><strong>Course specification:</strong> {record.courseSpecification}</p>}
        {flags.length > 0 && <p><strong>Status:</strong> {flags.join(', ')}</p>}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Certification</h2>
        <p><strong>Prepared by:</strong> {record.preparedBy || '—'} {record.preparedAt && `(${new Date(record.preparedAt).toLocaleString()})`}</p>
        <p><strong>Certified by:</strong> {record.certifiedBy?.fullName || '—'} {record.certifiedAt && `(${new Date(record.certifiedAt).toLocaleString()})`}</p>
        <p><strong>Validated by:</strong> {record.validatedBy?.fullName || '—'} {record.validatedAt && `(${new Date(record.validatedAt).toLocaleString()})`}</p>
      </div>
    </>
  );
}
