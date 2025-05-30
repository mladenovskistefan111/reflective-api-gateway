
import dotenv from 'dotenv';
import { validateEnv } from '../utils/validation.js';


dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  authServiceUrl: string;
  goalServiceUrl: string;
  logLevel: string;
}


const config: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || '', 
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',

  goalServiceUrl: process.env.GOAL_SERVICE_URL || 'http://localhost:3002', 

  logLevel: process.env.LOG_LEVEL || 'info',
};


try {
  validateEnv(config);
} catch (error: any) {
  console.error(`Environment validation error: ${error.message}`);
  process.exit(1);
}

export default config;