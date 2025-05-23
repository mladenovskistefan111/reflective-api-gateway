// reflective-api-gateway/src/app.ts
import 'express-async-errors'; // Must be imported first to wrap async route handlers
import express from 'express';
import { Server } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config/index';
import { logger } from './utils/logger';
import errorMiddleware from './middlewares/error.middleware';
import routes from './routes/index';

// Create Express application instance
const app = express();

// === Global Middleware Setup ===

// Security headers
app.use(helmet());

// Enable CORS for all origins (or configure specific origins for production)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Request logging (using morgan for HTTP request logs, pino for app logs)
app.use(morgan('dev')); // 'dev' is a concise output colored by response status for development

// === API Routes ===
// All API Gateway routes will be prefixed with /api
app.use('/api', routes);

// === Health Check Endpoint ===
// Useful for monitoring and deployment (e.g., Kubernetes liveness probes)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// === Error Handling Middleware ===
// This must be the last middleware added to catch all errors from routes and other middlewares
app.use(errorMiddleware);

// === Server Initialization ===
const PORT = config.port; // Get port from Gateway's config

// Variable to hold the HTTP server instance
let server: Server;

// Only start the server if not in a test environment (to avoid double-listening issues with Supertest)
if (config.nodeEnv !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT} in ${config.nodeEnv} mode`);
  });
} else {
  // In test environment, assign a dummy server instance for type consistency.
  // Supertest will handle the server lifecycle internally when testing `app`.
  server = {} as Server;
}

// Export the app for testing purposes
export { app, server };