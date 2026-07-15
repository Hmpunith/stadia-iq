import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function StaffPortal({ triggerTelemetryRefresh }) {
  // Tasks Queue State
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [activeVolunteer] = useState('John Doe'); // Sample volunteer user

  // Incident Reporter State
  const [rawText, setRawText] = useState('');
  const [reportLocation, setReportLocation] = useState('Gate A');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportedResult, setReportedResult] = useState(null);
  const [reporterError, setReporterError] = useState(null);

  // Fetch active tasks
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch {
      // Degrade silently
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Submit Raw Report Handler
  const handleRawReport = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) {
      return;
    }
    setReportLoading(true);
    setReporterError(null);
    setReportedResult(null);

    try {
      const response = await fetch('/api/log-incident-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText.trim(),
          location: reportLocation,
          reportedBy: `Volunteer ${activeVolunteer}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze incident.');
      }
      setReportedResult(data);
      setRawText('');
      fetchTasks(); // Refresh tasks as backend automatically schedules a checklist task!
      triggerTelemetryRefresh(); // Refresh organizer telemetry incident counts
    } catch (err) {
      setReporterError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Claim/Complete Task Handler
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          assignedTo: newStatus === 'IN_PROGRESS' ? activeVolunteer : undefined,
        }),
      });
      if (response.ok) {
        fetchTasks();
        triggerTelemetryRefresh();
      }
    } catch {
      // Degrade silently
    }
  };

  return (
    <div className="portal-grid">
      {/* Left Column: Multilingual Reporter */}
      <section className="glass-card animate-fade-in" aria-labelledby="report-section-title">
        <h2 id="report-section-title" style={{ fontSize: '1.4rem', marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          🚨 AI Incident Intake Console
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Speak or type incident reports in <strong>any language</strong>. The AI will translate, classify category, gauge severity, and generate active checklists instantly.
        </p>

        <form onSubmit={handleRawReport}>
          <div className="form-group">
            <label htmlFor="raw-incident-text" className="form-label" style={{ fontSize: '0.85rem' }}>Raw Log/Transcript</label>
            <textarea
              id="raw-incident-text"
              className="form-textarea"
              rows="4"
              placeholder="e.g. 'There is a huge puddle of cola on the stairs near seat section 105 causing people to trip' or Spanish: 'Hay un problema con las luces en la entrada del Sector 200...'"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={reportLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-location" className="form-label" style={{ fontSize: '0.85rem' }}>Location Area</label>
            <select
              id="report-location"
              className="form-select"
              value={reportLocation}
              onChange={(e) => setReportLocation(e.target.value)}
              disabled={reportLoading}
            >
              <option value="Gate A">Gate A Entrance</option>
              <option value="Gate B">Gate B Entrance</option>
              <option value="Gate C">Gate C Entrance</option>
              <option value="Gate D">Gate D Entrance</option>
              <option value="Section 100s">Lower Deck Sections</option>
              <option value="Section 200s">Middle Deck Sections</option>
              <option value="Section 300s">Upper Deck Sections</option>
              <option value="First Aid">First Aid Hub</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={reportLoading || !rawText.trim()}
            style={{ width: '100%', padding: '10px' }}
          >
            {reportLoading ? 'AI is analyzing & structuring report...' : 'Submit AI Incident Report'}
          </button>
        </form>

        {reporterError && (
          <div role="alert" style={{ background: 'rgba(239, 71, 111, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 71, 111, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginTop: '16px' }}>
            {reporterError}
          </div>
        )}

        {reportedResult && (
          <div style={{ background: 'rgba(0, 255, 135, 0.03)', border: '1px solid rgba(0, 255, 135, 0.2)', padding: '16px', borderRadius: '10px', marginTop: '20px' }} className="animate-fade-in">
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              ✓ GenAI Processed Successfully
            </h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
              <span className={`badge ${reportedResult.severity.toLowerCase()}`}>{reportedResult.severity}</span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{reportedResult.category}</span>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Title: {reportedResult.title}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
              Translation: {reportedResult.description}
            </p>

            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '12px', paddingTop: '8px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Auto-Scheduled Tasks:
              </p>
              <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {reportedResult.resolutionChecklist.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Right Column: Active Task Dispatcher */}
      <section className="glass-card animate-fade-in" aria-labelledby="tasks-section-title">
        <h2 id="tasks-section-title" style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          📋 Volunteer Task Dispatch
        </h2>

        {tasksLoading && tasks.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Updating tasks queue...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {tasks.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>
                No active work tasks found. Perfect!
              </p>
            ) : (
              tasks.map((task) => {
                const isAssignedToMe = task.assignedTo === activeVolunteer;
                const isUnassigned = task.assignedTo === 'Unassigned';

                return (
                  <div
                    key={task.id}
                    style={{
                      background: isAssignedToMe ? 'rgba(0, 240, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--color-border)',
                      borderColor: isAssignedToMe ? 'rgba(0, 240, 255, 0.25)' : 'var(--color-border)',
                      borderRadius: '12px',
                      padding: '16px',
                      opacity: task.status === 'COMPLETED' ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{task.title}</strong>
                      <span className={`badge ${task.status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {task.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                      {task.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Assignee: <strong>{task.assignedTo}</strong>
                      </span>

                      {task.status !== 'COMPLETED' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isUnassigned && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '6px' }}
                            >
                              Claim Task
                            </button>
                          )}
                          {isAssignedToMe && task.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '6px', color: '#000' }}
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}

StaffPortal.propTypes = {
  triggerTelemetryRefresh: PropTypes.func.isRequired,
};
