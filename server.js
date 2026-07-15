/**
 * @fileoverview StadiaIQ Backend Server — Entry Point
 * Express server powering smart stadium and tournament operations.
 *
 * @author StadiaIQ Team
 * @version 1.0.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './server/config.js';
import { logger } from './server/logger.js';
import { reportError } from './server/googleServices.js';
import {
  securityHeaders,
  permissionsPolicy,
  corsMiddleware,
  apiRateLimiter,
  requestIdMiddleware,
  inputSanitizer,
  enforceJsonContentType,
  compression,
} from './server/middleware.js';
import apiRoutes from './server/routes.js';
import { HTTP } from './server/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');

// ── Middleware Stack ────────────────────────────────────────────────────────

app.use(securityHeaders());
app.use(permissionsPolicy);
app.use(compression());
app.use(corsMiddleware());
app.use(express.json({ limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(enforceJsonContentType);
app.use(inputSanitizer);

// ── API Routes (rate-limited) ──────────────────────────────────────────────

app.use('/api', apiRateLimiter(), apiRoutes);

// ── Static Files (Production) ──────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

/** SPA fallback — serves index.html for all non-API routes */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Centralized Error Handler ──────────────────────────────────────────────

app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || HTTP.INTERNAL_SERVER_ERROR;
  const message = err.isOperational ? err.message : 'An unexpected error occurred';

  logger.error({
    error: err.message,
    stack: err.stack,
    statusCode,
    requestId: req.requestId,
    path: req.path,
  });

  reportError(err, { requestId: req.requestId, path: req.path });

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.requestId,
  });
});

// ── Start Server ───────────────────────────────────────────────────────────

let server = null;

if (config.nodeEnv !== 'test') {
  server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'StadiaIQ server is live 🏟️');
  });
}

// ── Graceful Shutdown ──────────────────────────────────────────────────────

function gracefulShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  if (server) {
    server.close(() => {
      logger.info('Server connections closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
