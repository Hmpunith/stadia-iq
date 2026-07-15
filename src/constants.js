/**
 * @fileoverview Frontend constants and static map coordinates for wayfinding.
 *
 * @module constants
 * @version 1.0.0
 */

export const MAP_NODES = {
  // Parking Lots
  'Lot P1': { id: 'Lot P1', x: 50, y: 100, label: 'Lot P1 (North Parking)', type: 'lot' },
  'Lot P2': { id: 'Lot P2', x: 50, y: 160, label: 'Lot P2 (East Parking)', type: 'lot' },
  'Lot P3': { id: 'Lot P3', x: 50, y: 240, label: 'Lot P3 (South Parking)', type: 'lot' },
  'Lot P4': { id: 'Lot P4', x: 50, y: 300, label: 'Lot P4 (West Parking)', type: 'lot' },

  // Transit Zones
  'Rail Terminal': { id: 'Rail Terminal', x: 80, y: 50, label: 'NJ Transit Rail Terminal', type: 'transit' },
  'Bus Shuttle Plaza': { id: 'Bus Shuttle Plaza', x: 80, y: 200, label: 'Bus Shuttle Plaza', type: 'transit' },
  'Rideshare Zone': { id: 'Rideshare Zone', x: 80, y: 350, label: 'Uber/Lyft Rideshare Zone', type: 'transit' },

  // Gates
  'Gate A': { id: 'Gate A', x: 220, y: 90, label: 'Gate A (North Entrance)', type: 'gate' },
  'Gate B': { id: 'Gate B', x: 220, y: 170, label: 'Gate B (East Entrance)', type: 'gate' },
  'Gate C': { id: 'Gate C', x: 220, y: 230, label: 'Gate C (South Entrance)', type: 'gate' },
  'Gate D': { id: 'Gate D', x: 220, y: 310, label: 'Gate D (West Entrance)', type: 'gate' },

  // Stadium Inner Sections
  'Section 100s': { id: 'Section 100s', x: 380, y: 120, label: 'Lower Tier: Sections 101-149', type: 'section' },
  'Section 200s': { id: 'Section 200s', x: 380, y: 200, label: 'Club Level: Sections 201-248', type: 'section' },
  'Section 300s': { id: 'Section 300s', x: 380, y: 280, label: 'Upper Tier: Sections 301-349', type: 'section' },

  // Facilities
  'Restrooms East': { id: 'Restrooms East', x: 520, y: 90, label: 'Restrooms (East Wing)', type: 'facility' },
  'Restrooms West': { id: 'Restrooms West', x: 520, y: 270, label: 'Restrooms (West Wing)', type: 'facility' },
  'Concessions North': { id: 'Concessions North', x: 520, y: 150, label: 'Concessions (North Plaza)', type: 'facility' },
  'Concessions South': { id: 'Concessions South', x: 520, y: 210, label: 'Concessions (South Plaza)', type: 'facility' },
  'First Aid': { id: 'First Aid', x: 520, y: 330, label: 'First Aid & Medical Station', type: 'facility' },
};

export const MAP_EDGES = [
  // Transit & Lots to Gates
  { from: 'Lot P1', to: 'Gate A' },
  { from: 'Lot P2', to: 'Gate B' },
  { from: 'Lot P3', to: 'Gate C' },
  { from: 'Lot P4', to: 'Gate D' },
  { from: 'Rail Terminal', to: 'Gate A' },
  { from: 'Rail Terminal', to: 'Gate B' },
  { from: 'Bus Shuttle Plaza', to: 'Gate B' },
  { from: 'Bus Shuttle Plaza', to: 'Gate C' },
  { from: 'Rideshare Zone', to: 'Gate C' },
  { from: 'Rideshare Zone', to: 'Gate D' },

  // Gates to Sections
  { from: 'Gate A', to: 'Section 100s' },
  { from: 'Gate B', to: 'Section 200s' },
  { from: 'Gate C', to: 'Section 300s' },
  { from: 'Gate D', to: 'Section 100s' },
  { from: 'Gate D', to: 'Section 300s' },

  // Sections to Facilities
  { from: 'Section 100s', to: 'Restrooms East' },
  { from: 'Section 100s', to: 'Concessions North' },
  { from: 'Section 200s', to: 'Concessions North' },
  { from: 'Section 200s', to: 'Concessions South' },
  { from: 'Section 300s', to: 'Restrooms West' },
  { from: 'Section 300s', to: 'Concessions South' },
  { from: 'Section 300s', to: 'First Aid' },
];

export const ECO_ACTIONS_LIST = [
  { id: 'recycle_cup', label: 'Recycle Cup', description: 'Log recycling a plastic/beverage cup.', points: 10, co2: '0.15 kg' },
  { id: 'public_transit', label: 'Take Transit', description: 'Arrive at the stadium via rail or bus.', points: 50, co2: '3.20 kg' },
  { id: 'digital_ticket', label: 'Digital Ticket', description: 'Scan paperless digital entrance ticket.', points: 5, co2: '0.05 kg' },
  { id: 'plant_based_meal', label: 'Vegan Food', description: 'Purchased a plant-based concession meal.', points: 20, co2: '0.85 kg' },
  { id: 'water_refill', label: 'Refill Water', description: 'Used refillable station instead of single-use bottle.', points: 15, co2: '0.25 kg' },
];
