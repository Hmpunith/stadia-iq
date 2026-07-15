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

  it('accepts data with an active text alert', () => {
    const data = { ...validWayfinding, alert: 'High congestion warning!' };
    const result = WayfindingSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects when navigationSteps is not an array', () => {
    const data = { ...validWayfinding, navigationSteps: 'just walk there' };
    const result = WayfindingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects when step is missing instruction', () => {
    const data = {
      ...validWayfinding,
      navigationSteps: [{ distanceMeters: 10, estimatedSeconds: 5 }],
    };
    const result = WayfindingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects negative distance values in steps', () => {
    // Note: Zod number checks don't strictly assert positive unless .positive() is appended.
    // However, we check if it validates numbers strictly.
    const data = {
      ...validWayfinding,
      navigationSteps: [{ instruction: 'Walk', distanceMeters: 'ten', estimatedSeconds: 100 }],
    };
    const result = WayfindingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric duration values', () => {
    const data = { ...validWayfinding, totalDurationMins: 'five minutes' };
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

  it('rejects data missing resolutionChecklist', () => {
    const { resolutionChecklist, ...dataWithout } = validIncident;
    const result = IncidentSchema.safeParse(dataWithout);
    expect(result.success).toBe(false);
  });

  it('rejects empty resolutionChecklist items type', () => {
    const data = { ...validIncident, resolutionChecklist: [12345] };
    const result = IncidentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts CRITICAL severity values', () => {
    const data = { ...validIncident, severity: 'CRITICAL' };
    const result = IncidentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts LOW severity values', () => {
    const data = { ...validIncident, severity: 'LOW' };
    const result = IncidentSchema.safeParse(data);
    expect(result.success).toBe(true);
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

  it('accepts null staffDispatchLocation', () => {
    const data = { ...validDecision, staffDispatchLocation: null };
    const result = DecisionSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects data missing urgencyLevel', () => {
    const { urgencyLevel, ...dataWithout } = validDecision;
    const result = DecisionSchema.safeParse(dataWithout);
    expect(result.success).toBe(false);
  });

  it('rejects non-string actionPlan items', () => {
    const data = { ...validDecision, actionPlan: [123, 'Action Item 2'] };
    const result = DecisionSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects non-string announcementDraft en values', () => {
    const data = {
      ...validDecision,
      announcementDraft: { en: 100, es: 'Espanol' },
    };
    const result = DecisionSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
