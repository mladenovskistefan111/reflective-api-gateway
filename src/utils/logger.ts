// reflective-api-gateway/src/utils/logger.ts
import pino from 'pino';
import config from '../config/index'; // Import the config we just created

const logger = pino({
  level: config.logLevel, // Use log level from config (e.g., 'info', 'debug')
  transport: {
    target: 'pino-pretty', // Use pino-pretty for development-friendly logs
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname', // Ignore pid and hostname in output for cleaner logs
    },
  },
});

export { logger };