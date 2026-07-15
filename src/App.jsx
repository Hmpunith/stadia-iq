import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import WayfinderMap from './components/WayfinderMap.jsx';
import FanPortal from './components/FanPortal.jsx';
import StaffPortal from './components/StaffPortal.jsx';
import AdminPortal from './components/AdminPortal.jsx';

export default function App() {
  const [activeRole, setActiveRole] = useState('fan');
  const [recommendedRoute, setRecommendedRoute] = useState(null);
  const [telemetry, setTelemetry] = useState({
    attendance: 54320,
    averageQueueTimeMins: 8.5,
    activeIncidentsCount: 2,
    transitDelayStatus: 'ON_TIME',
    crowdHeatmap: {
      'Gate A': 35,
      'Gate B': 75,
      'Gate C': 25,
      'Gate D': 55,
    },
  });

  // Fetch telemetry state from backend
  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/telemetry');
      const data = await response.json();
      if (response.ok && data && typeof data.attendance === 'number') {
        setTelemetry(data);
      }
    } catch {
      // Fallback silently during local offline operations
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Poll telemetry every 10 seconds for real-time dashboard simulation
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* WCAG AA Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header activeRole={activeRole} setActiveRole={setActiveRole} />

      <main id="main-content" className="container" style={{ paddingBottom: '48px', paddingTop: '16px' }}>
        {/* Portal-specific layout structure */}
        {activeRole === 'fan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ marginTop: '24px' }}>
              <WayfinderMap recommendedRoute={recommendedRoute} crowdHeatmap={telemetry.crowdHeatmap} />
            </div>
            <FanPortal
              setRoute={setRecommendedRoute}
              telemetry={telemetry}
              triggerTelemetryRefresh={fetchTelemetry}
            />
          </div>
        )}

        {activeRole === 'staff' && (
          <StaffPortal triggerTelemetryRefresh={fetchTelemetry} />
        )}

        {activeRole === 'organizer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ marginTop: '24px' }}>
              <WayfinderMap recommendedRoute={recommendedRoute} crowdHeatmap={telemetry.crowdHeatmap} />
            </div>
            <AdminPortal telemetry={telemetry} triggerTelemetryRefresh={fetchTelemetry} />
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', marginTop: '48px', padding: '24px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        <div className="container">
          <p>© 2026 StadiaIQ. All rights reserved. Built for PromptWars Challenge 4.</p>
          <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
            Powered by Google Gemini 2.5 Flash & Google Cloud Serverless Architecture.
          </p>
        </div>
      </footer>
    </>
  );
}
