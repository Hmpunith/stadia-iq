import React from 'react';
import PropTypes from 'prop-types';

export default function Header({ activeRole, setActiveRole }) {
  return (
    <header className="site-header" role="banner">
      <div className="container header-content">
        <div className="logo-container">
          <div className="logo-icon" aria-hidden="true">
            IQ
          </div>
          <div>
            <h1 className="logo-text">StadiaIQ</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-4px' }}>
              FIFA World Cup 2026 Operations
            </p>
          </div>
        </div>

        <div className="role-selector-container">
          <span id="role-select-label" className="form-label" style={{ display: 'inline-block', marginRight: '12px', fontSize: '0.8rem', verticalAlign: 'middle', color: 'var(--color-text-muted)', marginBottom: 0 }}>
            SELECT VIEW:
          </span>
          <div className="role-selector" role="radiogroup" aria-labelledby="role-select-label">
            <button
              className={`role-btn ${activeRole === 'fan' ? 'active fan' : ''}`}
              role="radio"
              aria-checked={activeRole === 'fan'}
              onClick={() => setActiveRole('fan')}
            >
              Fan Companion
            </button>
            <button
              className={`role-btn ${activeRole === 'staff' ? 'active staff' : ''}`}
              role="radio"
              aria-checked={activeRole === 'staff'}
              onClick={() => setActiveRole('staff')}
            >
              Volunteer Portal
            </button>
            <button
              className={`role-btn ${activeRole === 'organizer' ? 'active organizer' : ''}`}
              role="radio"
              aria-checked={activeRole === 'organizer'}
              onClick={() => setActiveRole('organizer')}
            >
              Organizer Cockpit
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  activeRole: PropTypes.string.isRequired,
  setActiveRole: PropTypes.func.isRequired,
};
