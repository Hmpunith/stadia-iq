import { describe, it, expect } from 'vitest';
import { WayfindingSchema, IncidentSchema, DecisionSchema } from '../server/schemas.js';

// =====================================================================
// WayfindingSchema Tests
// =====================================================================
describe('WayfindingSchema', () => {
  const validWayfinding = {
    recommendedRoute: ['Lot P1', 'Gate A', 'Section 100s'],
    navigationSteps: [
      { instruction: 'Proceed from Lot P1 to Gate A.', distanceMeters: 150, estimatedSeconds: 120 },
    ],
    crowdStatus: 'LOW',
    alert: null,
    totalDurationMins: 5.5,
  };

  it('accepts valid wayfinding data', () => {
    const result = WayfindingSchema.safeParse(validWayfinding);
    expect(result.success).toBe(true);
  });

  it('rejects data missing recommendedRoute', () => {
    const { recommendedRoute, ...dataWithout } = validWayfinding;
    const result = WayfindingSchema.safeParse(dataWithout);
    expect(result.success).toBe(false);
  });

  it('rejects data with invalid crowdStatus value', () => {
    const data = { ...validWayfinding, crowdStatus: 'EXTREME' };
    const result = WayfindingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// IncidentSchema Tests
// =====================================================================
describe('IncidentSchema', () => {
  const validIncident = {
    title: 'Water leak',
    description: 'Puddle in hallway',
    category: 'Safety',
    severity: 'MEDIUM',
    resolutionChecklist: ['Mop area', 'Place caution sign'],
  };

  it('accepts valid incident data', () => {
    const result = IncidentSchema.safeParse(validIncident);
    expect(result.success).toBe(true);
  });

  it('rejects data with invalid category value', () => {
    const data = { ...validIncident, category: 'UnrelatedCategory' };
    const result = IncidentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects data with invalid severity value', () => {
    const data = { ...validIncident, severity: 'NONE' };
    const result = IncidentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// DecisionSchema Tests
// =====================================================================
describe('DecisionSchema', () => {
  const validDecision = {
    situationSummary: 'Bottleneck at Gate B',
    urgencyLevel: 'HIGH',
    actionPlan: ['Redirect fans to Gate A', 'Dispatch volunteers'],
    announcementDraft: {
      en: 'Please proceed to Gate A to avoid delays.',
      es: 'Por favor proceda a la Puerta A.',
    },
    staffDispatchLocation: 'Gate B',
  };

  it('accepts valid decision data', () => {
    const result = DecisionSchema.safeParse(validDecision);
    expect(result.success).toBe(true);
  });

  it('rejects data missing announcementDraft translations', () => {
    const data = {
      ...validDecision,
      announcementDraft: { en: 'Please proceed to Gate A.' }, // missing es
    };
    const result = DecisionSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
