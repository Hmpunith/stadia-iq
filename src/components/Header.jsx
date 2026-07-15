/**
 * @fileoverview Application header with role-based navigation switcher
 * and dark/light theme toggle for WCAG AA accessibility compliance.
 *
 * @module Header
 */
import React from 'react';
import PropTypes from 'prop-types';

export default function Header({ activeRole, setActiveRole, theme, toggleTheme }) {
  return (
    <header className="site-header" role="banner">
      <div className="container header-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
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

        <div className="role-selector-container" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          <span id="role-select-label" className="form-label" style={{ display: 'inline-block', marginRight: '4px', fontSize: '0.8rem', verticalAlign: 'middle', color: 'var(--color-text-muted)', marginBottom: 0 }}>
            VIEW:
          </span>
          <div className="role-selector" role="radiogroup" aria-labelledby="role-select-label">
            <button
              className={`role-btn ${activeRole === 'fan' ? 'active fan' : ''}`}
              role="radio"
              aria-checked={activeRole === 'fan'}
              onClick={() => setActiveRole('fan')}
            >
              Fan
            </button>
            <button
              className={`role-btn ${activeRole === 'staff' ? 'active staff' : ''}`}
              role="radio"
              aria-checked={activeRole === 'staff'}
              onClick={() => setActiveRole('staff')}
            >
              Volunteer
            </button>
            <button
              className={`role-btn ${activeRole === 'organizer' ? 'active organizer' : ''}`}
              role="radio"
              aria-checked={activeRole === 'organizer'}
              onClick={() => setActiveRole('organizer')}
            >
              Organizer
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid var(--color-border)', cursor: 'pointer' }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  activeRole: PropTypes.string.isRequired,
  setActiveRole: PropTypes.func.isRequired,
  theme: PropTypes.string.isRequired,
  toggleTheme: PropTypes.func.isRequired,
};
