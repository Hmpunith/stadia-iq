/**
 * @fileoverview System constants and stadium configuration for StadiaIQ.
 *
 * @module constants
 * @version 1.0.0
 */

export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  TOO_MANY_REQUESTS: 429,
};

export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const STADIUM = {
  NAME: 'MetLife Stadium',
  CITY: 'East Rutherford, NJ',
  CAPACITY: 82500,
  GATES: ['Gate A', 'Gate B', 'Gate C', 'Gate D'],
  PARKING: ['Lot P1', 'Lot P2', 'Lot P3', 'Lot P4'],
  TRANSIT: ['Rail Terminal', 'Bus Shuttle Plaza', 'Rideshare Zone'],
  SECTIONS: ['Section 100s', 'Section 200s', 'Section 300s'],
};

export const ECO_ACTIONS = {
  RECYCLE_CUP: { id: 'recycle_cup', name: 'Recycled Beverage Cup', points: 10, co2SavingKg: 0.15 },
  PUBLIC_TRANSIT: { id: 'public_transit', name: 'Arrived via Rail/Bus', points: 50, co2SavingKg: 3.20 },
  DIGITAL_TICKET: { id: 'digital_ticket', name: 'Scanned Digital Ticket', points: 5, co2SavingKg: 0.05 },
  PLANT_BASED_MEAL: { id: 'plant_based_meal', name: 'Purchased Vegan Meal', points: 20, co2SavingKg: 0.85 },
  WATER_REFILL: { id: 'water_refill', name: 'Used Refillable Water Station', points: 15, co2SavingKg: 0.25 },
};
