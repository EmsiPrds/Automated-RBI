import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import client from '../api/client';

export default function DigitalId() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/resident-card')
      .then((res) => setCard(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load Digital ID');
        setCard(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-pulse" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (error && !card) {
    return (
      <motion.div
        className="card"
        style={{ maxWidth: 520 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="page-title">Barangay Digital ID</h1>
        <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
          Submit your household form (Form A). Once the Punong Barangay validates your record,
          your Digital ID will appear here. You can use it to claim benefits and access barangay
          services.
        </p>
        <div className="quick-actions">
          <Link to="/households/new">
            <motion.span className="btn btn-success" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>New household (Form A)</motion.span>
          </Link>
          <Link to="/households">
            <motion.span className="btn btn-outline" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>View households</motion.span>
          </Link>
        </div>
      </motion.div>
    );
  }

  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}${card.verifyPath}` : card.verifyPath;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="page-header">
        <h1 className="page-title">Barangay Digital ID</h1>
        <p className="page-subtitle">
          Use this ID when claiming benefits or using barangay services. Show the QR code at the counter for verification.
        </p>
      </div>
      <motion.div
        className="card digital-id-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="digital-id-brand">Records of Barangay Inhabitants</div>
        <div className="digital-id-label">Barangay Digital ID</div>
        <p className="digital-id-name">{card.fullName}</p>
        <p className="digital-id-number">ID: {card.idNumber}</p>
        {(card.householdAddress || card.barangay) && (
          <p className="digital-id-address">
            {[card.householdAddress, card.barangay, card.cityMunicipality].filter(Boolean).join(', ')}
          </p>
        )}
        <p className="digital-id-issued">
          Issued: {card.issuedAt ? new Date(card.issuedAt).toLocaleDateString() : '—'}
        </p>
        <div className="digital-id-qr">
          <QRCodeSVG value={verifyUrl} size={140} level="M" />
        </div>
        <p className="digital-id-scan">Scan to verify</p>
      </motion.div>
    </motion.div>
  );
}
