import jwt from 'jsonwebtoken';
import { ApiError } from './errors.js';

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  [key: string]: any; 
}

/**
 * Verify JWT token
 * @param token The JWT string to verify.
 * @param secret The secret key used for verification.
 * @returns The decoded JWT payload.
 * @throws ApiError if the token is invalid or expired.
 */
export const verifyJwt = (token: string, secret: string): JwtPayload => {
  if (!secret) {
    throw new Error('JWT_SECRET is not defined for JWT verification.');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Token expired');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid token');
    }

    throw new ApiError(500, 'Failed to verify token due to an internal error.');
  }
};