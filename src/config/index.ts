// reflective-api-gateway/src/config/index.ts
import dotenv from 'dotenv';
import { validateEnv } from '../utils/validation';

// Load environment variables from .env file
dotenv.config();

// Define the expected environment variables and their types
interface EnvConfig {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  authServiceUrl: string;
  taskTrackerServiceUrl: string;
  insightsEngineGrpcUrl: string;
  logLevel: string;
}

// Validate and load environment variables
const config: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10), // Gateway will typically run on 3000
  jwtSecret: process.env.JWT_SECRET || '', // Important for JWT validation
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  taskTrackerServiceUrl: process.env.TASK_TRACKER_SERVICE_URL || 'http://localhost:3002',
  insightsEngineGrpcUrl: process.env.INSIGHTS_ENGINE_GRPC_URL || 'localhost:50051', // gRPC uses host:port
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Perform validation
try {
  validateEnv(config);
} catch (error: any) {
  console.error(`❌ Environment validation error: ${error.message}`);
  process.exit(1); // Exit if essential environment variables are missing
}

export default config;