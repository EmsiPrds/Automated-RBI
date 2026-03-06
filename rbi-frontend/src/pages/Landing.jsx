import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">RBI</span>
        <nav className="landing-nav">
          <Link to="/login" className="landing-nav-link">Log in</Link>
          <Link to="/register" className="btn btn-sm">Sign up</Link>
        </nav>
      </header>
      <main className="landing-hero">
        <h1 className="landing-title">
          Resident Barangay Information
        </h1>
        <p className="landing-lead">
          Manage household data, Form B records, and digital IDs in one place. For residents, encoders, and barangay staff.
        </p>
        <div className="landing-actions">
          <Link to="/register" className="btn">Get started</Link>
          <Link to="/login" className="btn btn-outline">Log in</Link>
        </div>
        <p className="landing-verify">
          <Link to="/verify">Verify a resident ID</Link>
        </p>
      </main>
      <footer className="landing-footer">
        <p>RBI — Barangay information system</p>
      </footer>
    </div>
  );
}
