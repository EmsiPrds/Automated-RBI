import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function fullName(r) {
  return [r.lastName, r.firstName, r.middleName, r.nameExtension].filter(Boolean).join(' ') || '—';
}

const CERTIFICATE_TYPES = [
  { type: 'clearance', label: 'Barangay Clearance' },
  { type: 'residency', label: 'Certificate of Residency' },
  { type: 'indigency', label: 'Certificate of Indigency' },
  { type: 'good-moral', label: 'Certificate of Good Moral' },
];

export default function FormBView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(null);
  const [formBPdfLoading, setFormBPdfLoading] = useState(false);

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

  const generateCertificate = (certType) => {
    setCertLoading(certType);
    client.get(`/certificates/${certType}`, { params: { residentId: id }, responseType: 'blob' })
      .then((res) => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || `barangay-${certType}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Failed to generate certificate'))
      .finally(() => setCertLoading(null));
  };

  const downloadFormBPdf = () => {
    setFormBPdfLoading(true);
    client.get(`/form-b/${id}/pdf`, { responseType: 'blob' })
      .then((res) => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || 'RBI-Form-B.pdf';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Failed to generate Form B PDF.'))
      .finally(() => setFormBPdfLoading(false));
  };

  if (loading) return <div className="loading-pulse" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!record) return <p className="error-msg">Form B record not found.</p>;

  const canEdit = record.status === 'draft' && user?.role !== 'viewer';
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Form B: {fullName(record)}</h1>
          <p className="page-subtitle"><span className={`badge badge-${record.status}`}>{record.status}</span></p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <motion.button type="button" className="btn btn-outline" disabled={formBPdfLoading} onClick={downloadFormBPdf} whileTap={{ scale: 0.98 }}>
            {formBPdfLoading ? 'Generating...' : 'Download Form B (PDF)'}
          </motion.button>
          {canEdit && <Link to={`/form-b/${id}/edit`} className="btn">Edit</Link>}
          {canSubmit && <motion.button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('submit')} whileTap={{ scale: 0.98 }}>Submit for certification</motion.button>}
          {canCertify && <motion.button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('certify')} whileTap={{ scale: 0.98 }}>Certify</motion.button>}
          {canValidate && <motion.button type="button" className="btn btn-success" disabled={actionLoading} onClick={() => doAction('validate')} whileTap={{ scale: 0.98 }}>Validate</motion.button>}
          <motion.button type="button" className="btn btn-outline" onClick={() => navigate('/form-b')} whileTap={{ scale: 0.98 }}>Back to list</motion.button>
        </div>
      </div>
      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="card-heading">Location</h2>
        <div className="detail-grid">
          <p><strong>Region:</strong> {record.region || '—'}</p>
          <p><strong>Province:</strong> {record.province || '—'}</p>
          <p><strong>City/Municipality:</strong> {record.cityMunicipality || '—'}</p>
          <p><strong>Barangay:</strong> {record.barangay || '—'}</p>
          <p><strong>Residence address:</strong> {record.residenceAddress || '—'}</p>
          <p><strong>Household number:</strong> {record.householdNumber || '—'}</p>
          {record.dataSource && <p><strong>Data source:</strong> {record.dataSource}</p>}
        </div>
      </motion.div>
      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <h2 className="card-heading">Personal information</h2>
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
        <p><strong>Date accomplished:</strong> {record.dateAccomplished ? new Date(record.dateAccomplished).toLocaleDateString() : '—'}</p>
        {flags.length > 0 && <p><strong>Status:</strong> {flags.join(', ')}</p>}
      </motion.div>
      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <h2 className="card-heading">Generate certificate</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Download an official barangay certificate with this resident&apos;s data.</p>
        <div className="quick-actions">
          {CERTIFICATE_TYPES.map(({ type, label }) => (
            <motion.button
              key={type}
              type="button"
              className="btn btn-outline"
              disabled={!!certLoading}
              onClick={() => generateCertificate(type)}
              whileTap={{ scale: 0.98 }}
            >
              {certLoading === type ? 'Generating...' : label}
            </motion.button>
          ))}
        </div>
      </motion.div>
      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
        <h2 className="card-heading">Certification</h2>
        <div className="detail-grid">
          <p><strong>Prepared by:</strong> {record.preparedBy || '—'} {record.preparedAt && `(${new Date(record.preparedAt).toLocaleString()})`}</p>
          <p><strong>Certified by:</strong> {record.certifiedBy?.fullName || '—'} {record.certifiedAt && `(${new Date(record.certifiedAt).toLocaleString()})`}</p>
          <p><strong>Validated by:</strong> {record.validatedBy?.fullName || '—'} {record.validatedAt && `(${new Date(record.validatedAt).toLocaleString()})`}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
