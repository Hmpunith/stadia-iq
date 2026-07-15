/**
 * @fileoverview Configuration settings for the StadiaIQ server.
 * Loads environment variables and provides structured defaults.
 *
 * @module config
 * @version 1.0.0
 */

import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    fallbackModel: 'gemini-1.5-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.2'),
    topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '2048', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10), // 30 req/min/IP
  },
};

export default config;
