import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt.js';
import { ApiError } from '../utils/errors.js';
import config from '../config/index.js';


declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string; 
      role?: string;
      email?: string;
    };
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization token required or malformed.');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Authorization token is missing.');
  }

  try {
    const decoded = verifyJwt(token, config.jwtSecret);

    const userIdFromToken = typeof decoded.id === 'number' ? String(decoded.id) : decoded.id;

    req.user = {
      id: userIdFromToken,
      role: decoded.role, 
      email: decoded.email,
    } as Request['user']; 
    
    if (req.user?.id) {
      req.headers['x-user-id'] = req.user.id;
    } else {
      console.warn('Decoded JWT payload missing expected user ID (req.user.id)');
      throw new ApiError(500, 'Internal server error: User ID not found in token.');
    }

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'Invalid or expired token.');
  }
};

export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized: No user information found on request.');
    }

    if (roles.length > 0 && (!req.user.role || !roles.includes(req.user.role))) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions.');
    }

    next();
  };
};