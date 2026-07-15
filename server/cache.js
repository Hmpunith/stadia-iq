/**
 * @fileoverview Cache management for StadiaIQ server endpoints.
 * Caches Gemini queries to optimize costs and latency.
 *
 * @module cache
 * @version 1.0.0
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { logger } from './logger.js';

// Cache with 1 hour Time-To-Live (stdTTL)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

/**
 * Generates an MD5 hashed cache key with a prefix.
 *
 * @param {string} prefix - The namespace prefix for the cache
 * @param {string} input - The raw query string
 * @returns {string} The formatted cache key
 */
export function generateCacheKey(prefix, input) {
  const hash = crypto.createHash('md5').update(input).digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Retrieves a value from the cache.
 *
 * @param {string} key - Cache key
 * @returns {*|null} Cached object or null on miss
 */
export function getCached(key) {
  const value = cache.get(key);
  if (value !== undefined) {
    logger.info({ key: key.substring(0, 30) }, 'Cache Hit');
    return value;
  }
  return null;
}

/**
 * Sets a value in the cache.
 *
 * @param {string} key - Cache key
 * @param {*} value - The object to cache
 */
export function setCache(key, value) {
  cache.set(key, value);
}

/**
 * Clears the cache.
 */
export function clearCache() {
  cache.flushAll();
}
export default cache;
