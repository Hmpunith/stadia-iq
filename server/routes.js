/**
 * @fileoverview API route handlers for StadiaIQ.
 * Integrates Gemini AI for operations, caching, logging, and error handling.
 *
 * @module routes
 * @version 1.0.0
 */

import express from 'express';
import { genAI, writeCloudLog, insertAnalytics, reportError } from './googleServices.js';
import { WayfindingSchema, IncidentSchema, DecisionSchema } from './schemas.js';
import { WAYFINDER_INSTRUCTION, CHAT_INSTRUCTION, INCIDENT_INSTRUCTION, DECISION_INSTRUCTION } from './prompts.js';
import { ValidationError, AIServiceError, NotFoundError } from './errors.js';
import { generateCacheKey, getCached, setCache } from './cache.js';
import { logger } from './logger.js';
import config from './config.js';
import { HTTP } from './constants.js';
import * as db from './db.js';

const router = express.Router();

/**
 * Validates that the Gemini API key is configured.
 *
 * @throws {AIServiceError} If the API key is not configured
 */
function validateApiKey() {
  if (!config.gemini.apiKey) {
    throw new AIServiceError('Gemini AI service is not configured. Please set the GEMINI_API_KEY environment variable.');
  }
}

/**
 * Calls Google Gemini with the given system instruction and user prompt.
 * Implements caching, JSON parsing, and Zod schema validation.
 *
 * @param {string} systemInstruction - The AI system instruction
 * @param {string} userPrompt - The user's input
 * @param {import('zod').ZodSchema} schema - The Zod schema for validation
 * @param {string} cachePrefix - Cache key namespace prefix
 * @returns {Promise<object>} The validated AI response
 * @throws {AIServiceError} If the AI call or validation fails
 */
async function callGemini(systemInstruction, userPrompt, schema, cachePrefix) {
  const cacheKey = generateCacheKey(cachePrefix, userPrompt);
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  logger.info({ cacheKey: cacheKey.substring(0, 25) }, 'Cache Miss — Calling Gemini');

  const models = [config.gemini.model, config.gemini.fallbackModel];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: config.gemini.temperature,
          topP: config.gemini.topP,
          maxOutputTokens: config.gemini.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const text = response.text();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        logger.warn({ error: err.message, rawText: text }, 'JSON parse failed, attempting cleanup');
        try {
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch (cleanupErr) {
          logger.error({ error: cleanupErr.message, rawText: text }, 'JSON cleanup and parse failed');
          throw cleanupErr;
        }
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        logger.error({ errors: validated.error.issues }, 'Zod validation failed');
        throw new AIServiceError('AI response failed schema validation');
      }

      setCache(cacheKey, validated.data);
      return validated.data;
    } catch (err) {
      if (
        modelName !== models[models.length - 1] &&
        (err.message?.includes('503') ||
          err.message?.includes('429') ||
          err.message?.includes('overloaded') ||
          err.message?.includes('high demand') ||
          err.message?.includes('quota') ||
          err.message?.includes('RESOURCE_EXHAUSTED'))
      ) {
        logger.warn({ model: modelName, fallback: models[models.length - 1] }, 'Model unavailable, trying fallback');
        continue;
      }
      if (
        err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('503') ||
        err.message?.includes('high demand')
      ) {
        throw new AIServiceError('AI service is temporarily busy. Please wait 30 seconds and try again.');
      }
      throw err;
    }
  }
}

// ── 1. Health Endpoint ──────────────────────────────────────────────────────

/**
 * GET /api/health
 * Health check endpoint for Cloud Run and general diagnostics.
 */
router.get('/health', (req, res) => {
  writeCloudLog('INFO', 'Health check', { requestId: req.requestId });
  res.status(HTTP.OK).json({
    status: 'healthy',
    service: 'stadia-iq',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// ── 2. Telemetry Endpoints ──────────────────────────────────────────────────

/**
 * GET /api/telemetry
 * Retrieve simulated active stadium telemetry.
 */
router.get('/telemetry', (req, res) => {
  res.status(HTTP.OK).json(db.getTelemetry());
});

/**
 * POST /api/telemetry
 * Update simulated telemetry dynamically.
 */
router.post('/telemetry', (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    throw new ValidationError('Invalid request body. Telemetry updates required.');
  }
  const updated = db.updateTelemetry(updates);
  res.status(HTTP.OK).json(updated);
});

// ── 3. Wayfinding Route Calculator ──────────────────────────────────────────

/**
 * POST /api/wayfind
 * Congestion-aware wayfinding generator.
 */
router.post('/wayfind', async (req, res, next) => {
  const startTime = Date.now();
  try {
    validateApiKey();
    const { startNode, endNode } = req.body;

    if (!startNode || typeof startNode !== 'string' || !endNode || typeof endNode !== 'string') {
      throw new ValidationError('startNode and endNode parameters are required and must be strings.');
    }

    const telemetry = db.getTelemetry();
    const crowdHeatmapString = Object.entries(telemetry.crowdHeatmap)
      .map(([gate, congestion]) => `${gate}: ${congestion}% congestion`)
      .join(', ');

    const prompt = `Calculate the optimal route from "${startNode}" to "${endNode}".
Current gate congestion parameters: ${crowdHeatmapString}.
Ensure safety and suggest alternative paths if congestion exceeds 60%.`;

    const routeData = await callGemini(WAYFINDER_INSTRUCTION, prompt, WayfindingSchema, 'wayfind');

    // Logging & Analytics
    const duration = Date.now() - startTime;
    await writeCloudLog('INFO', 'Wayfinding route generated', {
      startNode,
      endNode,
      durationMs: duration,
      requestId: req.requestId,
    });

    await insertAnalytics({
      type: 'wayfinding',
      startNode,
      endNode,
      crowdStatus: routeData.crowdStatus,
      processingTimeMs: duration,
      requestId: req.requestId,
    });

    res.status(HTTP.OK).json(routeData);
  } catch (err) {
    reportError(err, { route: '/api/wayfind', requestId: req.requestId });
    next(err);
  }
});

// ── 4. Matchday Chatbot ─────────────────────────────────────────────────────

/**
 * POST /api/chat
 * GenAI matchday assistant chat endpoint.
 */
router.post('/chat', async (req, res, next) => {
  try {
    validateApiKey();
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message parameter is required and must be a string.');
    }

    // Standard cache lookup
    const cacheKey = generateCacheKey('chat', `${message}:${JSON.stringify(history || [])}`);
    const cached = getCached(cacheKey);
    if (cached) {
      return res.status(HTTP.OK).json({ response: cached });
    }

    const chatHistory = Array.isArray(history) ? history : [];
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      systemInstruction: CHAT_INSTRUCTION,
      generationConfig: {
        temperature: 0.6, // Higher temperature for friendly, conversational responses
        maxOutputTokens: 1000,
      },
    });

    const chatSession = model.startChat({
      history: chatHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chatSession.sendMessage(message);
    const responseText = result.response.text();

    setCache(cacheKey, responseText);

    res.status(HTTP.OK).json({ response: responseText });
  } catch (err) {
    reportError(err, { route: '/api/chat', requestId: req.requestId });
    next(err);
  }
});

// ── 5. Incident Endpoints ───────────────────────────────────────────────────

/**
 * GET /api/incidents
 * Retrieve all incidents from database.
 */
router.get('/incidents', (req, res) => {
  res.status(HTTP.OK).json(db.getIncidents());
});

/**
 * POST /api/incidents
 * Report a pre-structured incident.
 */
router.post('/incidents', (req, res) => {
  const incidentData = req.body;
  if (!incidentData.title || !incidentData.location || !incidentData.category) {
    throw new ValidationError('title, location, and category are required to log an incident.');
  }
  const logged = db.addIncident(incidentData);
  res.status(HTTP.CREATED).json(logged);
});

/**
 * PUT /api/incidents/:id
 * Update incident status or checklist.
 */
router.put('/incidents/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = db.updateIncident(id, updates);
  if (!updated) {
    throw new NotFoundError(`Incident with ID ${id} not found.`);
  }
  res.status(HTTP.OK).json(updated);
});

/**
 * POST /api/log-incident-raw
 * AI-assisted multilingual incident reporting. Parses raw text/voice transcript,
 * translates to English, assesses severity, creates checklist, and saves to database.
 */
router.post('/log-incident-raw', async (req, res, next) => {
  const startTime = Date.now();
  try {
    validateApiKey();
    const { text, location, reportedBy } = req.body;

    if (!text || typeof text !== 'string' || !location || typeof location !== 'string') {
      throw new ValidationError('text (raw transcript) and location are required parameters.');
    }

    const prompt = `Incident Details: "${text}"
Location reported: "${location}"`;

    const parsedIncident = await callGemini(INCIDENT_INSTRUCTION, prompt, IncidentSchema, 'incident-raw');

    // Save structured incident directly to the database
    const logged = db.addIncident({
      title: parsedIncident.title,
      description: parsedIncident.description,
      category: parsedIncident.category,
      severity: parsedIncident.severity,
      location,
      reportedBy: reportedBy || 'Volunteer Staff',
      resolutionChecklist: parsedIncident.resolutionChecklist,
    });

    const duration = Date.now() - startTime;
    await writeCloudLog('WARNING', 'Incident auto-logged via GenAI', {
      incidentId: logged.id,
      severity: logged.severity,
      processingTimeMs: duration,
      requestId: req.requestId,
    });

    await insertAnalytics({
      type: 'incident_analysis',
      severity: logged.severity,
      processingTimeMs: duration,
      requestId: req.requestId,
    });

    // Create corresponding work tasks automatically
    db.addTask({
      title: `${logged.category} Resolution checklist: ${logged.title}`,
      description: `Complete the checklist: ${logged.resolutionChecklist.join(', ')}`,
      incidentId: logged.id,
    });

    res.status(HTTP.CREATED).json(logged);
  } catch (err) {
    reportError(err, { route: '/api/log-incident-raw', requestId: req.requestId });
    next(err);
  }
});

// ── 6. Task Management Endpoints ────────────────────────────────────────────

/**
 * GET /api/tasks
 * Retrieve tasks queue.
 */
router.get('/tasks', (req, res) => {
  res.status(HTTP.OK).json(db.getTasks());
});

/**
 * PUT /api/tasks/:id
 * Update volunteer task completion/assignment status.
 */
router.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = db.updateTask(id, updates);
  if (!updated) {
    throw new NotFoundError(`Task with ID ${id} not found.`);
  }
  res.status(HTTP.OK).json(updated);
});

// ── 7. Sustainability / EcoGoal Endpoints ────────────────────────────────────

/**
 * GET /api/sustainability
 * Get aggregated eco-action stats.
 */
router.get('/sustainability', (req, res) => {
  res.status(HTTP.OK).json(db.getSustainability());
});

/**
 * POST /api/sustainability
 * Log a user eco-action.
 */
router.post('/sustainability', (req, res) => {
  const { username, actionId } = req.body;
  if (!username || !actionId) {
    throw new ValidationError('username and actionId parameters are required.');
  }

  const result = db.logEcoAction(username, actionId);
  if (!result) {
    throw new ValidationError(`Invalid eco-action actionId: ${actionId}.`);
  }

  res.status(HTTP.OK).json(result);
});

// ── 8. Operational Decision Support ──────────────────────────────────────────

/**
 * POST /api/decision
 * Command Center strategic operational intelligence recommendation.
 */
router.post('/decision', async (req, res, next) => {
  const startTime = Date.now();
  try {
    validateApiKey();
    const telemetry = db.getTelemetry();
    const activeIncidents = db.getIncidents().filter((inc) => inc.status !== 'CLOSED');

    const telemetryString = `Attendance: ${telemetry.attendance}, Avg queue time: ${telemetry.averageQueueTimeMins} mins, Transit: ${telemetry.transitDelayStatus}`;
    const incidentsString = activeIncidents
      .map((inc) => `[${inc.severity}] ${inc.category} at ${inc.location}: ${inc.title}`)
      .join('\n');

    const prompt = `STADIUM STATUS:
${telemetryString}

ACTIVE INCIDENTS:
${incidentsString || 'No active incidents.'}

Generate an operational decision and response protocol for these stadium events.`;

    const decisionResponse = await callGemini(DECISION_INSTRUCTION, prompt, DecisionSchema, 'decision');

    const duration = Date.now() - startTime;
    await writeCloudLog('CRITICAL', 'Operational Strategic Decision Generated', {
      urgencyLevel: decisionResponse.urgencyLevel,
      durationMs: duration,
      requestId: req.requestId,
    });

    await insertAnalytics({
      type: 'decision_support',
      urgencyLevel: decisionResponse.urgencyLevel,
      processingTimeMs: duration,
      requestId: req.requestId,
    });

    res.status(HTTP.OK).json(decisionResponse);
  } catch (err) {
    reportError(err, { route: '/api/decision', requestId: req.requestId });
    next(err);
  }
});

export default router;
