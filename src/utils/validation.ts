import { ApiError } from './errors.js'; 
/**
 * Validates that essential environment variables are set.
 * Throws an error if any required variable is missing.
 * @param config The loaded environment configuration object.
 */
export const validateEnv = (config: any) => {
  const requiredEnvVars = [
    'jwtSecret',
    'authServiceUrl',
    'goalServiceUrl'
  ];

  for (const key of requiredEnvVars) {
    if (!config[key] || config[key] === '') {
      throw new ApiError(500, `Missing required environment variable: ${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`);
    }
  }
};