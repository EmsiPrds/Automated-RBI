import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function VerifyId() {
  const { idNumber } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!!idNumber);

  useEffect(() => {
    if (!idNumber) {
      setLoading(false);
      return;
    }
    axios
      .get(`/api/resident-card/verify/${encodeURIComponent(idNumber)}`)
      .then((res) => setResult(res.data))
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [idNumber]);

  if (!idNumber) {
    return (
      <div className="auth-page">
        <motion.div
          className="auth-card-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <h1 className="auth-title">Verify Barangay ID</h1>
            <p className="auth-subtitle">Open the link from a QR code scan or enter an ID number in the URL.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-page">
        <motion.div
          className="auth-card-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="loading-pulse">Verifying...</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card-wrap"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1 className="auth-title">Verify Barangay ID</h1>
          {result?.valid ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.1rem', margin: '0.5rem 0 0' }}>Valid Barangay ID</p>
              <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{result.fullName}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{result.barangay}{result.cityMunicipality ? `, ${result.cityMunicipality}` : ''}</p>
              {result.issuedAt && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Issued: {new Date(result.issuedAt).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          ) : (
            <p style={{ color: 'var(--danger)', fontWeight: 500, margin: '0.5rem 0 0' }}>Invalid or expired ID</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
