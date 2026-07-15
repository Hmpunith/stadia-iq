/**
 * @fileoverview Zod schemas for validating Gemini AI structured JSON outputs.
 * Ensures data integrity and type safety for critical operational tasks.
 *
 * @module schemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { SEVERITY } from './constants.js';

/**
 * Zod schema for wayfinding route optimization.
 */
export const WayfindingSchema = z.object({
  recommendedRoute: z.array(z.string()).describe('An ordered list of node IDs to traverse (e.g. Parking Lot, Gate B, Section 100s)'),
  navigationSteps: z.array(
    z.object({
      instruction: z.string().describe('Clear user-facing navigation instruction'),
      distanceMeters: z.number().describe('Estimated step distance in meters'),
      estimatedSeconds: z.number().describe('Estimated step duration in seconds'),
    })
  ).describe('Step-by-step navigation instructions'),
  crowdStatus: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('Congestion level along the recommended route'),
  alert: z.string().nullable().describe('Safety alert or bottleneck warning if applicable, otherwise null'),
  totalDurationMins: z.number().describe('Total estimated trip duration in minutes'),
});

/**
 * Zod schema for volunteer/staff incident report analysis.
 */
export const IncidentSchema = z.object({
  title: z.string().describe('Descriptive incident title in English'),
  description: z.string().describe('English summary/translation of the incident'),
  category: z.enum(['Safety', 'Maintenance', 'Technology', 'Crowd', 'Cleaning', 'Medical', 'Security']).describe('Incident operational category'),
  severity: z.enum([SEVERITY.LOW, SEVERITY.MEDIUM, SEVERITY.HIGH, SEVERITY.CRITICAL]).describe('Operational severity rating'),
  resolutionChecklist: z.array(z.string()).describe('Recommended actionable checklist items for volunteers to resolve the incident'),
});

/**
 * Zod schema for organizer operational decision support.
 */
export const DecisionSchema = z.object({
  situationSummary: z.string().describe('Brief operational analysis of the active situation'),
  urgencyLevel: z.enum([SEVERITY.LOW, SEVERITY.MEDIUM, SEVERITY.HIGH, SEVERITY.CRITICAL]).describe('Immediate operational urgency rating'),
  actionPlan: z.array(z.string()).describe('Chronological list of tactical mitigation actions for the organizer'),
  announcementDraft: z.object({
    en: z.string().describe('English draft for stadium loudspeakers or app alerts'),
    es: z.string().describe('Spanish draft for stadium loudspeakers or app alerts'),
  }).describe('Multilingual warning message drafts'),
  staffDispatchLocation: z.string().nullable().describe('Target stadium zone or gate where extra volunteers/staff should deploy, or null'),
});
