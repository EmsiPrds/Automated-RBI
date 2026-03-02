import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  if (loading) return <p>Loading...</p>;

  if (error && !card) {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h1 style={{ marginTop: 0 }}>Barangay Digital ID</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Submit your household form (Form A). Once the Punong Barangay validates your record,
          your Digital ID will appear here. You can use it to claim benefits and access barangay
          services.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/households/new" className="btn btn-success">
            New household (Form A)
          </Link>
          <Link to="/households" className="btn btn-outline">
            View households
          </Link>
        </div>
      </div>
    );
  }

  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}${card.verifyPath}` : card.verifyPath;

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Barangay Digital ID</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Use this ID when claiming benefits or using barangay services. Show the QR code at the
        counter for verification.
      </p>
      <div
        className="card"
        style={{
          maxWidth: 380,
          border: '2px solid var(--border)',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '1rem', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
          Records of Barangay Inhabitants
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Barangay Digital ID
        </div>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '1.1rem' }}>{card.fullName}</p>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>ID: {card.idNumber}</p>
        {(card.householdAddress || card.barangay) && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {[card.householdAddress, card.barangay, card.cityMunicipality].filter(Boolean).join(', ')}
          </p>
        )}
        <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Issued: {card.issuedAt ? new Date(card.issuedAt).toLocaleDateString() : '—'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', background: '#fff', borderRadius: 8 }}>
          <QRCodeSVG value={verifyUrl} size={140} level="M" />
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Scan to verify
        </p>
      </div>
    </>
  );
}
