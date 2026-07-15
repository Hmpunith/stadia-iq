import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function AdminPortal({ telemetry, triggerTelemetryRefresh }) {
  // Incident Feed State
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  // Strategic AI State
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerResult, setPlannerResult] = useState(null);
  const [plannerError, setPlannerError] = useState(null);

  // Fetch all incidents
  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const response = await fetch('/api/incidents');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setIncidents(data);
      } else {
        setIncidents([]);
      }
    } catch {
      // Degrade silently
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [telemetry]);

  // Run Strategic AI planner
  const handleRunPlanner = async () => {
    setPlannerLoading(true);
    setPlannerError(null);
    setPlannerResult(null);
    try {
      const response = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate strategic protocol.');
      }
      setPlannerResult(data);
    } catch (err) {
      setPlannerError(err.message);
    } finally {
      setPlannerLoading(false);
    }
  };

  // Simulate Telemetry adjustments
  const handleSimulateTelemetry = async (type) => {
    let updates = {};
    if (type === 'traffic_spike') {
      updates = {
        crowdHeatmap: {
          'Gate A': 30,
          'Gate B': 95, // Extreme congestion spike
          'Gate C': 20,
          'Gate D': 40,
        },
        averageQueueTimeMins: 22.4,
      };
    } else if (type === 'transit_delay') {
      updates = {
        transitDelayStatus: 'DELAYED (30 MINS)',
        averageQueueTimeMins: 14.5,
      };
    } else if (type === 'reset') {
      updates = {
        crowdHeatmap: {
          'Gate A': 35,
          'Gate B': 45,
          'Gate C': 25,
          'Gate D': 30,
        },
        averageQueueTimeMins: 6.8,
        transitDelayStatus: 'ON_TIME',
      };
    }

    try {
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        triggerTelemetryRefresh();
      }
    } catch {
      // Degrade silently
    }
  };

  const handleUpdateIncidentStatus = async (incidentId, newStatus) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchIncidents();
        triggerTelemetryRefresh();
      }
    } catch {
      // Degrade silently
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
      {/* 1. Telemetry Dashboard Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }} aria-label="Stadium Telemetry Overview">
        {/* Attendance */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-accent)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Stadium Attendance
          </p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#fff' }}>
            {telemetry.attendance.toLocaleString()}
          </p>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>
            ● Capacity: {(telemetry.attendance / 82500 * 100).toFixed(1)}% Full
          </span>
        </div>

        {/* Avg Queue Time */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-secondary)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Average Gate Queue
          </p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#fff' }}>
            {telemetry.averageQueueTimeMins} mins
          </p>
          <span style={{ fontSize: '0.7rem', color: telemetry.averageQueueTimeMins > 15 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {telemetry.averageQueueTimeMins > 15 ? '▲ Alert: Long queues' : '● Queue speeds optimal'}
          </span>
        </div>

        {/* Active Incidents */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-primary)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Incident Tickets
          </p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#fff' }}>
            {telemetry.activeIncidentsCount}
          </p>
          <span style={{ fontSize: '0.7rem', color: telemetry.activeIncidentsCount > 3 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            ● {telemetry.activeIncidentsCount} pending staff dispatch
          </span>
        </div>

        {/* Transit Status */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-warning)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            NJ Transit Departures
          </p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#fff', textTransform: 'uppercase', fontSize: '1.4rem', lineHeight: '2.2rem' }}>
            {telemetry.transitDelayStatus}
          </p>
          <span style={{ fontSize: '0.7rem', color: telemetry.transitDelayStatus.includes('DELAY') ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {telemetry.transitDelayStatus.includes('DELAY') ? '▲ Schedule disruption' : '● Trains operating on schedule'}
          </span>
        </div>
      </section>

      {/* 2. Simulation & AI Planner Grid */}
      <div className="portal-grid">
        {/* Left Column: Command & AI Planning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Simulation Controls */}
          <section className="glass-card animate-fade-in" aria-labelledby="sim-card-title">
            <h2 id="sim-card-title" style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              ⚡ Matchday Anomaly Simulator
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Simulate operational stadium problems to test how the GenAI wayfinding reroutes fans and generates emergency action plans.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => handleSimulateTelemetry('traffic_spike')}
                className="btn btn-secondary"
                style={{ flexGrow: 1, padding: '10px', fontSize: '0.8rem' }}
              >
                🚨 Spike Gate B Congestion (95%)
              </button>
              <button
                onClick={() => handleSimulateTelemetry('transit_delay')}
                className="btn btn-secondary"
                style={{ flexGrow: 1, padding: '10px', fontSize: '0.8rem' }}
              >
                🚆 Delay Rail Departures
              </button>
              <button
                onClick={() => handleSimulateTelemetry('reset')}
                className="btn btn-primary"
                style={{ flexGrow: 1, padding: '10px', fontSize: '0.8rem', color: '#000' }}
              >
                ↻ Reset Telemetry to Normal
              </button>
            </div>
          </section>

          {/* Strategic AI Command Console */}
          <section className="glass-card animate-fade-in" aria-labelledby="ai-cockpit-title">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h2 id="ai-cockpit-title" style={{ fontSize: '1.4rem', color: 'var(--color-text-primary)', margin: 0 }}>
                🤖 GenAI Strategic Response Planner
              </h2>
              <button
                onClick={handleRunPlanner}
                className="btn btn-primary animate-glow-green"
                disabled={plannerLoading}
                style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#000' }}
              >
                {plannerLoading ? 'Solving Operations...' : 'Analyze & Solve'}
              </button>
            </div>

            {plannerError && (
              <div role="alert" style={{ background: 'rgba(239, 71, 111, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 71, 111, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                {plannerError}
              </div>
            )}

            {!plannerResult && !plannerLoading && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '10px' }}>
                Click <strong>"Analyze & Solve"</strong> to invoke Google Gemini, analyzing active incidents and telemetry metrics to generate strategic directives.
              </div>
            )}

            {plannerResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Urgency Assessment:</span>
                    <span className={`badge ${plannerResult.urgencyLevel.toLowerCase()}`}>{plannerResult.urgencyLevel}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    <strong>Situation:</strong> {plannerResult.situationSummary}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '6px', fontWeight: 600 }}>
                    Tactical Action Protocols:
                  </h4>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {plannerResult.actionPlan.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>

                {plannerResult.staffDispatchLocation && (
                  <div style={{ background: 'rgba(0, 240, 255, 0.04)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    📢 <strong>Volunteer Redirection:</strong> Deploy reinforcement volunteers to: <strong>{plannerResult.staffDispatchLocation}</strong>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '6px', fontWeight: 600 }}>
                    Emergency Broadcast Drafts:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#090d15', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>ENGLISH (PA/Mobile)</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '2px' }}>"{plannerResult.announcementDraft.en}"</p>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>SPANISH (PA/Mobile)</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '2px' }}>"{plannerResult.announcementDraft.es}"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Active Incident Feed */}
        <section className="glass-card animate-fade-in" aria-labelledby="incidents-card-title">
          <h2 id="incidents-card-title" style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            🔔 Live Incident Logs
          </h2>

          {loadingIncidents && incidents.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Refreshing feeds...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '480px', overflowY: 'auto' }}>
              {incidents.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>
                  No incident reports logged.
                </p>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      background: inc.status === 'CLOSED' ? 'rgba(255,255,255,0.01)' : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--color-border)',
                      borderLeft: `4px solid ${inc.status === 'CLOSED' ? 'var(--color-text-muted)' : inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)'}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      opacity: inc.status === 'CLOSED' ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{inc.title}</strong>
                      <span className={`badge ${inc.status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{inc.status}</span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      {inc.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      <span>
                        Loc: <strong>{inc.location}</strong> | Category: <strong>{inc.category}</strong>
                      </span>
                      {inc.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, 'CLOSED')}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.65rem', borderRadius: '4px' }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

AdminPortal.propTypes = {
  telemetry: PropTypes.shape({
    attendance: PropTypes.number,
    averageQueueTimeMins: PropTypes.number,
    activeIncidentsCount: PropTypes.number,
    transitDelayStatus: PropTypes.string,
    crowdHeatmap: PropTypes.objectOf(PropTypes.number),
  }).isRequired,
  triggerTelemetryRefresh: PropTypes.func.isRequired,
};
