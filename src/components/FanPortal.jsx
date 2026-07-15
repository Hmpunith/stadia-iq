import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MAP_NODES, ECO_ACTIONS_LIST } from '../constants.js';

export default function FanPortal({ setRoute, telemetry, triggerTelemetryRefresh }) {
  // Wayfinding State
  const [startNode, setStartNode] = useState('Lot P1');
  const [endNode, setEndNode] = useState('Section 100s');
  const [wayfindLoading, setWayfindLoading] = useState(false);
  const [wayfindResult, setWayfindResult] = useState(null);
  const [wayfindError, setWayfindError] = useState(null);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hi there! I am your StadiaIQ Matchday Assistant. Ask me anything about tournament schedules, clear bag policies, NJ Transit train departures, or water refill stations.' },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // EcoGoal State
  const [username] = useState('Fan-123'); // Preset username
  const [ecoStats, setEcoStats] = useState({ userPoints: 80, userCo2SavedKg: 3.5, globalPoints: 2450, globalCo2SavedKg: 154.6 });
  const [ecoLoading, setEcoLoading] = useState(false);
  const [ecoSuccessMessage, setEcoSuccessMessage] = useState(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (typeof chatBottomRef.current?.scrollIntoView === 'function') {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Fetch Sustainability Stats on load
  useEffect(() => {
    fetch('/api/sustainability')
      .then((res) => res.json())
      .then((data) => {
        const userData = data.users[username] || { points: 0, co2SavedKg: 0 };
        setEcoStats({
          userPoints: userData.points,
          userCo2SavedKg: userData.co2SavedKg,
          globalPoints: data.totalPoints,
          globalCo2SavedKg: data.totalCo2SavedKg,
        });
      })
      .catch(() => {});
  }, [username]);

  // Wayfinding Handler
  const handleWayfind = async (e) => {
    e.preventDefault();
    setWayfindLoading(true);
    setWayfindError(null);
    setRoute(null);
    try {
      const response = await fetch('/api/wayfind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNode, endNode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate route.');
      }
      setWayfindResult(data);
      setRoute(data.recommendedRoute);
    } catch (err) {
      setWayfindError(err.message);
    } finally {
      setWayfindLoading(false);
    }
  };

  // Chat Handler
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) {
      return;
    }
    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const apiHistory = chatHistory.slice(-6); // Limit history for tokens
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: apiHistory }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get chat response.');
      }
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'assistant', content: `Sorry, I encountered an issue: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // EcoAction Log Handler
  const handleLogEcoAction = async (actionId) => {
    setEcoLoading(true);
    setEcoSuccessMessage(null);
    try {
      const response = await fetch('/api/sustainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, actionId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log eco-action.');
      }
      setEcoStats({
        userPoints: data.userPoints,
        userCo2SavedKg: data.userCo2SavedKg,
        globalPoints: data.global.totalPoints,
        globalCo2SavedKg: data.global.totalCo2SavedKg,
      });
      setEcoSuccessMessage(`Logged! +${data.action.points} points. Saved ${data.action.co2SavingKg}kg CO₂!`);
      triggerTelemetryRefresh();
      setTimeout(() => setEcoSuccessMessage(null), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setEcoLoading(false);
    }
  };

  // Filter nodes for dropdowns
  const startNodes = Object.values(MAP_NODES).filter((n) => n.type === 'lot' || n.type === 'transit');
  const endNodes = Object.values(MAP_NODES).filter((n) => n.type === 'gate' || n.type === 'section' || n.type === 'facility');

  return (
    <div className="portal-grid">
      {/* Left Column: Routing & EcoGoals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Route Optimization */}
        <section className="glass-card animate-fade-in" aria-labelledby="route-card-title">
          <h2 id="route-card-title" style={{ fontSize: '1.4rem', marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            🏆 Congestion-Aware Wayfinder
          </h2>
          <form onSubmit={handleWayfind} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="start-node" className="form-label" style={{ fontSize: '0.85rem' }}>Matchday Origin</label>
              <select
                id="start-node"
                className="form-select"
                value={startNode}
                onChange={(e) => setStartNode(e.target.value)}
              >
                {startNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="end-node" className="form-label" style={{ fontSize: '0.85rem' }}>Target Destination</label>
              <select
                id="end-node"
                className="form-select"
                value={endNode}
                onChange={(e) => setEndNode(e.target.value)}
              >
                {endNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={wayfindLoading}
                style={{ width: '100%', padding: '10px' }}
              >
                {wayfindLoading ? 'Calculating optimal path...' : 'Find Smart Route'}
              </button>
            </div>
          </form>

          {wayfindError && (
            <div role="alert" style={{ background: 'rgba(239, 71, 111, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 71, 111, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {wayfindError}
            </div>
          )}

          {wayfindResult && (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Estimated Duration:</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--color-secondary)' }}>
                  {wayfindResult.totalDurationMins} mins
                </strong>
              </div>

              {wayfindResult.alert && (
                <div role="alert" style={{ background: 'rgba(255, 209, 102, 0.08)', color: 'var(--color-warning)', border: '1px solid rgba(255, 209, 102, 0.15)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 500 }}>
                  ⚠️ {wayfindResult.alert}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Route Congestion Index:</span>
                <span className={`badge ${wayfindResult.crowdStatus.toLowerCase()}`}>{wayfindResult.crowdStatus}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Navigation Steps:
                </p>
                <ol style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wayfindResult.navigationSteps.map((step, idx) => (
                    <li key={idx}>
                      {step.instruction} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({step.distanceMeters}m · ~{Math.round(step.estimatedSeconds / 60)}m)</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>

        {/* Sustainability EcoGoals */}
        <section className="glass-card animate-fade-in" aria-labelledby="eco-card-title">
          <h2 id="eco-card-title" style={{ fontSize: '1.4rem', marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            🌿 EcoGoal Matchday Tracker
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(0, 255, 135, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 255, 135, 0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Your Points</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>{ecoStats.userPoints}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>saved {ecoStats.userCo2SavedKg}kg CO₂</p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Global Stadium Offsets</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{ecoStats.globalPoints} pts</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>saved {ecoStats.globalCo2SavedKg}kg CO₂</p>
            </div>
          </div>

          {ecoSuccessMessage && (
            <div role="alert" style={{ background: 'rgba(0, 255, 135, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0, 255, 135, 0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>
              🎉 {ecoSuccessMessage}
            </div>
          )}

          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
              Log Eco-Friendly Actions:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ECO_ACTIONS_LIST.map((act) => (
                <div
                  key={act.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 14px' }}
                >
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{act.label}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{act.description}</p>
                  </div>
                  <button
                    onClick={() => handleLogEcoAction(act.id)}
                    className="btn btn-secondary"
                    disabled={ecoLoading}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', minWidth: '80px' }}
                  >
                    +{act.points} pts
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Chatbot */}
      <section className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }} aria-labelledby="chat-card-title">
        <h2 id="chat-card-title" style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          💬 Matchday Copilot
        </h2>

        {/* Message Thread */}
        <div style={{ flexGrow: 1, background: '#090d15', borderRadius: '10px', border: '1px solid var(--color-border)', padding: '16px', overflowY: 'auto', maxHeight: '340px', minHeight: '260px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: msg.role === 'user' ? 'var(--color-secondary)' : 'rgba(255, 255, 255, 0.04)',
                color: msg.role === 'user' ? '#07090e' : 'var(--color-text-primary)',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 0 14px' : '14px 14px 14px 0',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                fontSize: '0.85rem',
                wordBreak: 'break-word',
                lineHeight: 1.4,
              }}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '14px 14px 14px 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Assistant is thinking...
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask about schedules, trains, bag policies..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            disabled={chatLoading}
            style={{ borderRadius: '10px' }}
            aria-label="Matchday query input"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={chatLoading || !chatMessage.trim()}
            style={{ borderRadius: '10px', padding: '12px 18px' }}
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

FanPortal.propTypes = {
  setRoute: PropTypes.func.isRequired,
  telemetry: PropTypes.shape({
    attendance: PropTypes.number,
    averageQueueTimeMins: PropTypes.number,
    activeIncidentsCount: PropTypes.number,
    transitDelayStatus: PropTypes.string,
    crowdHeatmap: PropTypes.objectOf(PropTypes.number),
  }),
  triggerTelemetryRefresh: PropTypes.func.isRequired,
};
