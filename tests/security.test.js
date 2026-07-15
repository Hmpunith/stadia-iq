import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// Mock GCP Services
vi.mock('../server/googleServices.js', () => ({
  genAI: {
    getGenerativeModel: vi.fn(),
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

let app;
beforeAll(async () => {
  const mod = await import('../server.js');
  app = mod.default ?? mod.app ?? mod;
});

describe('Security Headers Checks', () => {
  it('sets X-Content-Type-Options to nosniff', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options header to SAMEORIGIN', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('includes Content-Security-Policy header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('includes X-Request-Id header in UUID format', async () => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const res = await request(app).get('/api/health');
    const requestId = res.headers['x-request-id'];
    expect(requestId).toBeDefined();
    expect(requestId).toMatch(uuidPattern);
  });

  it('includes Permissions-Policy header containing camera', async () => {
    const res = await request(app).get('/api/health');
    const pp = res.headers['permissions-policy'];
    expect(pp).toBeDefined();
    expect(pp).toMatch(/camera=\(\)/);
  });

  it('hides X-Powered-By Express signature header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('includes Referrer-Policy header set to strict-origin-when-cross-origin', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('includes Cross-Origin-Opener-Policy header set to same-origin', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
  });
});

describe('JSON Content-Type Enforcement', () => {
  it('returns 415 when POST body is non-JSON', async () => {
    const res = await request(app)
      .post('/api/telemetry')
      .set('Content-Type', 'text/plain')
      .send('attendance=10000');
    expect(res.status).toBe(415);
  });
});

describe('Rate Limiter Checks', () => {
  it('returns 429 after exceeding the request limit of 30', async () => {
    const totalRequests = 35;
    const results = [];

    for (let i = 0; i < totalRequests; i++) {
      const res = await request(app).get('/api/health');
      results.push(res.status);
    }

    const has429 = results.includes(429);
    expect(has429).toBe(true);
  });
});
