import React from 'react';

export default function SplashScreen() {
  return (
    <div className="splash-screen" aria-label="Loading application">
      <div className="splash-content">
        <div className="splash-logo">RBI</div>
        <p className="splash-tagline">Resident Barangay Information</p>
        <div className="splash-loader" aria-hidden="true">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </div>
  );
}
