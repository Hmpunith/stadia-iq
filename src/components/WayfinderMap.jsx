/**
 * @fileoverview Interactive SVG wayfinder map for MetLife Stadium.
 * Renders parking lots, gates, sections, and facilities as clickable nodes
 * with congestion-aware heatmap coloring and animated route paths.
 *
 * @module WayfinderMap
 */
import React from 'react';
import PropTypes from 'prop-types';
import { MAP_NODES, MAP_EDGES } from '../constants.js';

export default function WayfinderMap({ recommendedRoute, crowdHeatmap }) {
  // Convert recommended route to coordinates for drawing the path
  const getRoutePoints = () => {
    if (!recommendedRoute || recommendedRoute.length === 0) {
      return '';
    }
    return recommendedRoute
      .map((nodeId) => {
        const node = MAP_NODES[nodeId];
        return node ? `${node.x},${node.y}` : '';
      })
      .filter((pts) => pts !== '')
      .join(' ');
  };

  const getHeatmapColor = (gateId) => {
    if (!crowdHeatmap) {
      return 'var(--color-primary)';
    }
    const val = crowdHeatmap[gateId] || 0;
    if (val >= 70) {
      return 'var(--color-danger)';
    }
    if (val >= 40) {
      return 'var(--color-warning)';
    }
    return 'var(--color-success)';
  };

  const getNodeColor = (node) => {
    if (node.type === 'gate') {
      return getHeatmapColor(node.id);
    }
    switch (node.type) {
      case 'lot':
        return '#4a5568'; // Muted grey
      case 'transit':
        return 'var(--color-secondary)'; // Cyan
      case 'section':
        return 'var(--color-accent)'; // Violet
      case 'facility':
        return '#ed64a6'; // Pink
      default:
        return '#fff';
    }
  };

  const routePoints = getRoutePoints();

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>Live Stadium Telemetry Map</h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', marginTop: '4px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-secondary)' }}></span> Transit
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)' }}></span> Tiers
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></span> Gate (Low)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }}></span> Gate (Congested)
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', background: '#090d15', borderRadius: '12px', border: '1px solid var(--color-border)', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', minHeight: '380px' }}>
        <svg viewBox="0 0 600 400" width="100%" height="100%" style={{ maxHeight: '420px' }}>
          <defs>
            {/* Glow filters */}
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* SVG Grid Pattern */}
          <g opacity="0.05">
            <line x1="0" y1="50" x2="600" y2="50" stroke="#fff" strokeWidth="1" />
            <line x1="0" y1="100" x2="600" y2="100" stroke="#fff" strokeWidth="1" />
            <line x1="0" y1="150" x2="600" y2="150" stroke="#fff" strokeWidth="1" />
            <line x1="0" y1="200" x2="600" y2="200" stroke="#fff" strokeWidth="1" />
            <line x1="0" y1="250" x2="600" y2="250" stroke="#fff" strokeWidth="1" />
            <line x1="0" y1="300" x2="600" y2="300" stroke="#fff" strokeWidth="1" />
            <line x1="0" y1="350" x2="600" y2="350" stroke="#fff" strokeWidth="1" />
            <line x1="100" y1="0" x2="100" y2="400" stroke="#fff" strokeWidth="1" />
            <line x1="200" y1="0" x2="200" y2="400" stroke="#fff" strokeWidth="1" />
            <line x1="300" y1="0" x2="300" y2="400" stroke="#fff" strokeWidth="1" />
            <line x1="400" y1="0" x2="400" y2="400" stroke="#fff" strokeWidth="1" />
            <line x1="500" y1="0" x2="500" y2="400" stroke="#fff" strokeWidth="1" />
          </g>

          {/* 1. Base Map Edges */}
          <g>
            {MAP_EDGES.map((edge, index) => {
              const fromNode = MAP_NODES[edge.from];
              const toNode = MAP_NODES[edge.to];
              if (!fromNode || !toNode) {
                return null;
              }
              return (
                <line
                  key={`edge-${index}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="2"
                />
              );
            })}
          </g>

          {/* 2. Recommended Route Glowing Path */}
          {routePoints && (
            <polyline
              points={routePoints}
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-cyan)"
              style={{
                strokeDasharray: '10, 10',
                animation: 'dash 30s linear infinite',
              }}
            />
          )}

          {/* 3. Node Circles and Text Labels */}
          <g>
            {Object.values(MAP_NODES).map((node) => {
              const color = getNodeColor(node);
              const isActive = recommendedRoute && recommendedRoute.includes(node.id);
              return (
                <g key={node.id} className="map-node-group">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? 8 : 5}
                    fill={color}
                    stroke={isActive ? '#fff' : 'rgba(0,0,0,0.4)'}
                    strokeWidth={isActive ? 2 : 1}
                    filter={isActive ? 'url(#glow-green)' : undefined}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text
                    x={node.x}
                    y={node.y - 12}
                    textAnchor="middle"
                    fill={isActive ? 'var(--color-secondary)' : 'var(--color-text-muted)'}
                    fontSize={isActive ? '10px' : '8px'}
                    fontWeight={isActive ? 'bold' : 'normal'}
                    style={{ pointerEvents: 'none', transition: 'all 0.3s ease' }}
                  >
                    {node.id}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Dash Animation CSS embedded locally inside the SVG container */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes dash {
            to {
              stroke-dashoffset: -1000;
            }
          }
          .map-node-group:hover text {
            fill: #fff !important;
            font-size: 10px !important;
          }
          .map-node-group:hover circle {
            r: 9px !important;
            stroke: #fff !important;
          }
        `}} />
      </div>
    </div>
  );
}

WayfinderMap.propTypes = {
  recommendedRoute: PropTypes.arrayOf(PropTypes.string),
  crowdHeatmap: PropTypes.objectOf(PropTypes.number),
};
