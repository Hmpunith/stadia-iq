/**
 * @fileoverview Middleware module — Centralizes all Express middleware.
 * Security headers, compression, CORS, rate limiting, request tracking,
 * input sanitization, and Permissions-Policy.
 *
 * @module middleware
 * @version 1.0.0
 */

import helmet from 'helmet';
import cors from 'cors';
import compressionMiddleware from 'compression';
import { rateLimit } from 'express-rate-limit';
import crypto from 'crypto';
import xss from 'xss';
import config from './config.js';

/**
 * Configures Helmet security headers with a custom CSP
 * whitelisting Google APIs and Google Fonts.
 *
 * @returns {import('express').RequestHandler} Helmet middleware
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "https://apis.google.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        formActionSrc: ["'self'"],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
  });
}

/**
 * Sets the Permissions-Policy header to restrict browser feature access.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function permissionsPolicy(req, res, next) {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
}

/**
 * Configures CORS middleware.
 *
 * @returns {import('express').RequestHandler} CORS middleware
 */
export function corsMiddleware() {
  return cors();
}

/**
 * Configures API rate limiting per IP address.
 *
 * @returns {import('express').RequestHandler} Rate limiter middleware
 */
export function apiRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: { error: 'Too many requests. Please wait a moment before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Attaches a unique request ID (UUID v4) to every incoming request
 * for tracing and security audit.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function requestIdMiddleware(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

/**
 * Sanitizes all string values in the request body to prevent XSS attacks.
 * Strips dangerous HTML and JavaScript from user input.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
}

/**
 * Enforces Content-Type: application/json on POST, PUT, and PATCH requests.
 * Rejects requests with missing or incorrect Content-Type headers.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function enforceJsonContentType(req, res, next) {
  const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];
  if (methodsRequiringBody.includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({
      error: 'Unsupported Media Type. Content-Type must be application/json.',
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
  }
  next();
}

export { compressionMiddleware as compression };
