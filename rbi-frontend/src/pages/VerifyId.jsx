import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
      <div className="container" style={{ maxWidth: 400, marginTop: '3rem', textAlign: 'center' }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Verify Barangay ID</h1>
          <p style={{ color: 'var(--text-muted)' }}>Open the link from a QR code scan or enter an ID number in the URL.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: 400, marginTop: '3rem', textAlign: 'center' }}>
        <div className="card"><p>Verifying...</p></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: '3rem', textAlign: 'center' }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Verify Barangay ID</h1>
        {result?.valid ? (
          <>
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.1rem' }}>Valid Barangay ID</p>
            <p style={{ margin: '0.5rem 0 0' }}><strong>{result.fullName}</strong></p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{result.barangay}{result.cityMunicipality ? `, ${result.cityMunicipality}` : ''}</p>
            {result.issuedAt && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Issued: {new Date(result.issuedAt).toLocaleDateString()}
              </p>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--danger)', fontWeight: 500 }}>Invalid or expired ID</p>
        )}
      </div>
    </div>
  );
}
