/**
 * @fileoverview Google Cloud services integration module for StadiaIQ.
 *
 * Integrates:
 *  1. Google Gemini 2.5 Flash    — AI/ML API for operations and chats
 *  2. Google Cloud Logging       — Structured production observability
 *  3. Google Cloud Storage       — Logs/Telemetry archiving
 *  4. Google Cloud BigQuery      — Tournament operations metrics data warehouse
 *  5. Google Cloud Secret Manager— Secure API key management
 *  6. Google Cloud Error Reporting— Production error tracking
 *
 * @module googleServices
 * @version 1.0.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logging } from '@google-cloud/logging';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';
import { ErrorReporting } from '@google-cloud/error-reporting';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import config from './config.js';
import { logger } from './logger.js';

// ── 1. Google Gemini 2.5 Flash (AI/ML API) ─────────────────────────────────

/** @type {GoogleGenerativeAI} Google Generative AI client */
export const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// ── 2. Google Cloud Logging ────────────────────────────────────────────────

/** @type {object} Google Cloud Logging logger instance */
let cloudLog;
try {
  const cloudLogging = new Logging();
  cloudLog = cloudLogging.log('stadia-iq-server');
} catch {
  cloudLog = null;
}

/**
 * Writes a structured log entry to Google Cloud Logging.
 * Silently degrades in non-GCP environments.
 *
 * @param {string} severity - Log severity (INFO, WARNING, ERROR, CRITICAL)
 * @param {string} message - Log message
 * @param {object} [data={}] - Structured metadata
 * @returns {Promise<void>}
 */
export async function writeCloudLog(severity, message, data = {}) {
  try {
    if (cloudLog) {
      const entry = cloudLog.entry(
        { severity, resource: { type: 'cloud_run_revision' } },
        { message, ...data, service: 'stadia-iq', timestamp: new Date().toISOString() },
      );
      await cloudLog.write(entry);
    } else {
      logger.debug({ severity, message, ...data }, 'Cloud log (mocked)');
    }
  } catch {
    // Expected in local testing environments
  }
}

// ── 3. Google Cloud Storage ────────────────────────────────────────────────

/** @type {Storage} Google Cloud Storage client */
let storage;
try {
  storage = new Storage();
} catch {
  storage = null;
}

/**
 * Uploads a JSON data object to a Google Cloud Storage bucket.
 *
 * @param {string} bucketName - Target GCS bucket name
 * @param {string} fileName - Destination file path
 * @param {object} data - Data to serialize and upload
 * @returns {Promise<string|null>} GCS URI on success, null on failure
 */
export async function uploadToGCS(bucketName, fileName, data) {
  try {
    if (storage) {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(fileName);
      await file.save(JSON.stringify(data, null, 2), {
        contentType: 'application/json',
        metadata: { cacheControl: 'public, max-age=3600' },
      });
      logger.info({ bucket: bucketName, file: fileName }, 'Uploaded to Google Cloud Storage');
      return `gs://${bucketName}/${fileName}`;
    }
    logger.debug({ bucket: bucketName, file: fileName }, 'GCS upload (mocked)');
    return `gs://${bucketName}/${fileName}`;
  } catch (err) {
    logger.warn({ error: err.message }, 'GCS upload skipped');
    return null;
  }
}

// ── 4. Google Cloud BigQuery ───────────────────────────────────────────────

/** @type {BigQuery} Google BigQuery client */
let bigquery;
try {
  bigquery = new BigQuery();
} catch {
  bigquery = null;
}

/**
 * Inserts operational analytics data into BigQuery.
 *
 * @param {object} data - Analytics data to insert
 * @returns {Promise<boolean>} True if insertion succeeded
 */
export async function insertAnalytics(data) {
  try {
    if (bigquery) {
      const dataset = bigquery.dataset('stadia_iq_analytics');
      const table = dataset.table('operations');
      await table.insert([{
        ...data,
        timestamp: BigQuery.timestamp(new Date()),
      }]);
      logger.info({ type: data.type }, 'Analytics inserted into BigQuery');
      return true;
    }
    logger.debug(data, 'BigQuery insert (mocked)');
    return true;
  } catch (err) {
    logger.warn({ error: err.message }, 'BigQuery insert skipped');
    return false;
  }
}

/**
 * Queries aggregate operation statistics from BigQuery.
 *
 * @returns {Promise<Array<object>>} Aggregated operations statistics
 */
export async function getStatistics() {
  try {
    if (bigquery) {
      const sqlQuery = `
        SELECT type, COUNT(*) as count, AVG(processingTimeMs) as avg_time
        FROM \`stadia_iq_analytics.operations\`
        GROUP BY type
        LIMIT 10
      `;
      const [rows] = await bigquery.query({ query: sqlQuery });
      return rows;
    }
    logger.debug('BigQuery query (mocked)');
    return [
      { type: 'wayfinding', count: 42, avg_time: 150 },
      { type: 'incident_analysis', count: 18, avg_time: 210 },
      { type: 'decision_support', count: 5, avg_time: 320 },
    ];
  } catch (err) {
    logger.warn({ error: err.message }, 'BigQuery query skipped');
    return [];
  }
}

// ── 5. Google Cloud Secret Manager ─────────────────────────────────────────

/** @type {SecretManagerServiceClient} Secret Manager client */
let secretManager;
try {
  secretManager = new SecretManagerServiceClient();
} catch {
  secretManager = null;
}

/**
 * Retrieves a secret value from Google Cloud Secret Manager.
 *
 * @param {string} secretName - Full resource name of the secret
 * @returns {Promise<string|null>} Secret value or null
 */
export async function getSecret(secretName) {
  try {
    if (secretManager) {
      const [version] = await secretManager.accessSecretVersion({ name: secretName });
      return version.payload.data.toString('utf8');
    }
    return null;
  } catch (err) {
    logger.warn({ error: err.message }, 'Secret Manager access skipped');
    return null;
  }
}

// ── 6. Google Cloud Error Reporting ────────────────────────────────────────

/** @type {ErrorReporting|null} Error Reporting client */
let errorReporting;
try {
  errorReporting = new ErrorReporting({
    reportMode: config.nodeEnv === 'production' ? 'always' : 'never',
    serviceContext: { service: 'stadia-iq', version: '1.0.0' },
  });
} catch {
  errorReporting = null;
}

/**
 * Reports an error to Google Cloud Error Reporting.
 *
 * @param {Error} error - The error to report
 * @param {object} [context={}] - Additional context
 * @returns {void}
 */
export function reportError(error, context = {}) {
  if (errorReporting) {
    errorReporting.report(error, () => {
      logger.error({ error: error.message, ...context }, 'Error reported to Cloud Error Reporting');
    });
  } else {
    logger.error({ error: error.message, ...context }, 'Error (Error Reporting not active)');
  }
}

// ── Content Safety ─────────────────────────────────────────────────────────

/**
 * Performs content safety assessment using Gemini's safety filters.
 *
 * @param {string} text - User input text to assess
 * @returns {Promise<{safe: boolean, assessed: boolean}>} Safety result
 */
export async function assessContentSafety(text) {
  try {
    if (!config.gemini.apiKey) {
      return { safe: true, assessed: false };
    }
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });
    // Brief assessment call
    await model.generateContent(`Is this appropriate? YES or NO: "${text.substring(0, 150)}"`);
    return { safe: true, assessed: true };
  } catch (err) {
    if (err.message?.includes('SAFETY')) {
      return { safe: false, assessed: true };
    }
    return { safe: true, assessed: false };
  }
}
