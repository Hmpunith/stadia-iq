/**
 * @fileoverview Pino structured logging setup for StadiaIQ.
 *
 * @module logger
 * @version 1.0.0
 */

import pino from 'pino';
import config from './config.js';

export const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
export default logger;
