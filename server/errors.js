/**
 * @fileoverview Custom error class hierarchy for StadiaIQ.
 * Provides structured, operational error handling with HTTP status codes.
 *
 * @module errors
 * @version 1.0.0
 */

import { HTTP } from './constants.js';

/**
 * Base application error class.
 * All custom errors extend this class for consistent error handling.
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP.INTERNAL_SERVER_ERROR, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

/**
 * Validation error for invalid user input.
 */
export class ValidationError extends AppError {
  constructor(message) {
    super(message, HTTP.BAD_REQUEST, 'VALIDATION_ERROR');
  }
}

/**
 * AI service error for Gemini API failures.
 */
export class AIServiceError extends AppError {
  constructor(message) {
    super(message, 502, 'AI_SERVICE_ERROR'); // Bad Gateway for external APIs
  }
}

/**
 * Rate limit error when request quota is exceeded.
 */
export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests. Please wait before trying again.', HTTP.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Not found error for missing resources.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HTTP.NOT_FOUND, 'NOT_FOUND');
  }
}
