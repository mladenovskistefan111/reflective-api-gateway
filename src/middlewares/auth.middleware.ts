// reflective-api-gateway/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt'; // We will create this jwt utility next
import { ApiError } from '../utils/errors';
import config from '../config/index';

/**
 * Middleware to verify JWT token and attach user to request
 * This middleware runs on the API Gateway for all protected routes.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization token required or malformed.');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Authorization token is missing.');
  }

  try {
    // Verify token using the JWT_SECRET from the Gateway's config
    // The Gateway uses the same secret as the Auth service to verify tokens it issued.
    const decoded = verifyJwt(token, config.jwtSecret);

    // Attach user info to request (from the decoded token)
    req.user = decoded; // This is typed by src/types/express.d.ts

    next();
  } catch (error: any) {
    // Log the error for debugging purposes (e.g., token expired, invalid signature)
    // console.error('JWT verification failed:', error.message); // Use logger later
    if (error instanceof ApiError) {
      throw error; // Re-throw custom ApiErrors
    }
    // Catch any other errors from jsonwebtoken (e.g., TokenExpiredError, JsonWebTokenError)
    throw new ApiError(401, 'Invalid or expired token.');
  }
};

/**
 * OPTIONAL: Middleware to check user roles if needed at the Gateway level.
 * For now, roles can be checked at the specific microservice level if preferred.
 * This is included for completeness, mirroring your Auth service.
 */
export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This case should ideally be caught by authMiddleware, but as a safeguard:
      throw new ApiError(401, 'Unauthorized: No user information found on request.');
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions.');
    }

    next();
  };
};