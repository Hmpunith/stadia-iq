import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import * as db from '../server/db.js';

// ── Mock Google Cloud Services ─────────────────────────────────────────────
const mockWayfindingResponse = JSON.stringify({
  recommendedRoute: ['Lot P1', 'Gate A', 'Section 100s'],
  navigationSteps: [
    { instruction: 'Proceed from Lot P1 to Gate A.', distanceMeters: 150, estimatedSeconds: 120 },
  ],
  crowdStatus: 'LOW',
  alert: null,
  totalDurationMins: 5.5,
});

const mockIncidentResponse = JSON.stringify({
  title: 'Cola Spill Section 104',
  description: 'Sticky soda spill on walkway in section 104.',
  category: 'Safety',
  severity: 'MEDIUM',
  resolutionChecklist: ['Mop sticky spill', 'Place warning cone'],
});

const mockDecisionResponse = JSON.stringify({
  situationSummary: 'Bottleneck at Gate B and transit delay',
  urgencyLevel: 'HIGH',
  actionPlan: ['Reroute traffic to Gate A', 'Alert train operators'],
  announcementDraft: {
    en: 'Rail transit delayed. Please use alternative shuttles.',
    es: 'Transporte ferroviario retrasado. Use autobuses alternativos.',
  },
  staffDispatchLocation: 'Gate B',
});

const mockChatResponse = 'Test response message from AI assistant.';

const mockGenerateContent = vi.fn();
const mockStartChat = vi.fn().mockReturnValue({
  sendMessage: vi.fn().mockResolvedValue({
    response: { text: vi.fn().mockReturnValue(mockChatResponse) },
  }),
});

vi.mock('../server/googleServices.js', () => ({
  genAI: {
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: (...args) => mockGenerateContent(...args),
      startChat: (...args) => mockStartChat(...args),
    }),
  },
  writeCloudLog: vi.fn(),
  insertAnalytics: vi.fn().mockResolvedValue(true),
  getStatistics: vi.fn().mockResolvedValue([]),
  reportError: vi.fn(),
  assessContentSafety: vi.fn().mockResolvedValue({ safe: true, assessed: true }),
}));

vi.mock('../server/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

process.env.GEMINI_API_KEY = 'mock-key';

let app;
beforeAll(async () => {
  const mod = await import('../server.js');
  app = mod.default ?? mod.app ?? mod;
});

beforeEach(() => {
  db.resetDB();
  vi.clearAllMocks();
});

// =====================================================================
// API Endpoint Tests
// =====================================================================
describe('StadiaIQ API Endpoints', () => {
  describe('GET /api/health', () => {
    it('returns 200 with status healthy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Telemetry Endpoints', () => {
    it('GET /api/telemetry returns stadium metrics', async () => {
      const res = await request(app).get('/api/telemetry');
      expect(res.status).toBe(200);
      expect(res.body.attendance).toBeDefined();
      expect(res.body.crowdHeatmap).toBeDefined();
    });

    it('POST /api/telemetry updates metrics successfully', async () => {
      const res = await request(app)
        .post('/api/telemetry')
        .send({ attendance: 65000, averageQueueTimeMins: 12.5 });
      expect(res.status).toBe(200);
      expect(res.body.attendance).toBe(65000);
      expect(res.body.averageQueueTimeMins).toBe(12.5);
    });

    it('POST /api/telemetry returns 400 when body is invalid', async () => {
      const res = await request(app)
        .post('/api/telemetry')
        .set('Content-Type', 'application/json')
        .send('not-an-object');
      expect(res.status).toBe(400);
    });
  });

  describe('Incident Tickets Endpoints', () => {
    it('GET /api/incidents lists all incidents', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('GET /api/incidents returns arrays starting with seeded inc-1', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.body[0].id).toBe('inc-1');
      expect(res.body[0].location).toBe('Gate B');
    });

    it('POST /api/incidents logs structured incident successfully', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .send({ title: 'Leak', location: 'Gate A', category: 'Maintenance' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Leak');
      expect(res.body.status).toBe('OPEN');
    });

    it('POST /api/incidents returns 400 when missing parameters', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .send({ title: 'Leak' }); // missing location & category
      expect(res.status).toBe(400);
    });

    it('PUT /api/incidents/:id updates incident status', async () => {
      const res = await request(app)
        .put('/api/incidents/inc-1')
        .send({ status: 'CLOSED' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CLOSED');
    });

    it('PUT /api/incidents/:id returns 404 for missing incident', async () => {
      const res = await request(app)
        .put('/api/incidents/inc-missing')
        .send({ status: 'CLOSED' });
      expect(res.status).toBe(404);
    });
  });

  describe('Tasks Management Endpoints', () => {
    it('GET /api/tasks lists all tasks', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('GET /api/tasks returns seeded task-1 first', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.body[0].id).toBe('task-1');
      expect(res.body[0].assignedTo).toBe('John Doe');
    });

    it('PUT /api/tasks/:id updates task status', async () => {
      const res = await request(app)
        .put('/api/tasks/task-1')
        .send({ status: 'COMPLETED' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('COMPLETED');
    });

    it('PUT /api/tasks/:id returns 404 for missing task', async () => {
      const res = await request(app)
        .put('/api/tasks/task-missing')
        .send({ status: 'COMPLETED' });
      expect(res.status).toBe(404);
    });
  });

  describe('Sustainability / EcoGoal Endpoints', () => {
    it('GET /api/sustainability lists statistics', async () => {
      const res = await request(app).get('/api/sustainability');
      expect(res.status).toBe(200);
      expect(res.body.totalPoints).toBe(100);
    });

    it('POST /api/sustainability logs user actions and increments points', async () => {
      const res = await request(app)
        .post('/api/sustainability')
        .send({ username: 'Fan-X', actionId: 'recycle_cup' });
      expect(res.status).toBe(200);
      expect(res.body.action.points).toBe(10);
      expect(res.body.userPoints).toBe(10);
    });

    it('POST /api/sustainability returns 400 for invalid actionId', async () => {
      const res = await request(app)
        .post('/api/sustainability')
        .send({ username: 'Fan-X', actionId: 'invalid_action' });
      expect(res.status).toBe(400);
    });

    it('POST /api/sustainability returns 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/sustainability')
        .send({ username: 'Fan-X' }); // missing actionId
      expect(res.status).toBe(400);
    });
  });

  describe('Gemini AI Smart Endpoints', () => {
    it('POST /api/wayfind generates congestion-aware routes via Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: vi.fn().mockReturnValue(mockWayfindingResponse) },
      });

      const res = await request(app)
        .post('/api/wayfind')
        .send({ startNode: 'Lot P1', endNode: 'Section 100s' });

      expect(res.status).toBe(200);
      expect(res.body.recommendedRoute).toContain('Gate A');
      expect(res.body.totalDurationMins).toBe(5.5);
    });

    it('POST /api/wayfind returns 400 for missing nodes parameters', async () => {
      const res = await request(app)
        .post('/api/wayfind')
        .send({ startNode: 'Lot P1' }); // missing endNode
      expect(res.status).toBe(400);
    });

    it('POST /api/chat provides copilot chat answers via Gemini', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'What is the clear bag policy?' });

      expect(res.status).toBe(200);
      expect(res.body.response).toBe(mockChatResponse);
    });

    it('POST /api/chat returns 400 for missing message parameter', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/chat returns 400 when message is an array', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: ['bag policy?'] });
      expect(res.status).toBe(400);
    });

    it('POST /api/log-incident-raw ingests multilingual reports into DB via Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: vi.fn().mockReturnValue(mockIncidentResponse) },
      });

      const res = await request(app)
        .post('/api/log-incident-raw')
        .send({ text: 'Cola tirada en sector 104', location: 'Section 100s' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Cola Spill Section 104');
      expect(res.body.severity).toBe('MEDIUM');
    });

    it('POST /api/log-incident-raw returns 400 for missing parameters', async () => {
      const res = await request(app)
        .post('/api/log-incident-raw')
        .send({ text: 'Broken chair' }); // missing location
      expect(res.status).toBe(400);
    });

    it('POST /api/decision generates operational decisions via Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: vi.fn().mockReturnValue(mockDecisionResponse) },
      });

      const res = await request(app)
        .post('/api/decision')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.urgencyLevel).toBe('HIGH');
      expect(res.body.staffDispatchLocation).toBe('Gate B');
    });
  });
});
