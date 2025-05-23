// reflective-api-gateway/src/utils/validation.ts
import { ApiError } from './errors'; // We'll create ApiError next

/**
 * Validates that essential environment variables are set.
 * Throws an error if any required variable is missing.
 * @param config The loaded environment configuration object.
 */
export const validateEnv = (config: any) => {
  const requiredEnvVars = [
    'jwtSecret',
    'authServiceUrl',
    'taskTrackerServiceUrl',
    'insightsEngineGrpcUrl'
  ];

  for (const key of requiredEnvVars) {
    if (!config[key] || config[key] === '') {
      throw new ApiError(500, `Missing required environment variable: ${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`);
    }
  }
};