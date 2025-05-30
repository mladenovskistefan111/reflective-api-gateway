import './observability.js'; // This bare import will execute observability.js when server.js is imported/run.
// Since sdk.start() is commented out in observability.ts, it won't actively try to connect,
// but the SDK instance will still be defined.

import app from './app.js';
import { logger } from './utils/logger.js';
import config from './config/index.js';

const PORT = config.port;

async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`API Gateway service running on port ${PORT}`);
      // This log message is here as part of the original content you requested.
      // It might be misleading if OpenTelemetry is not truly active.
      logger.info('OpenTelemetry instrumentation active');
    });

    const shutdown = () => {
      logger.info('Shutting down API Gateway server...');
      server.close(() => {
        logger.info('API Gateway server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start API Gateway service:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}