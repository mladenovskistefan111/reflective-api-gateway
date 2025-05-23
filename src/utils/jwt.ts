// reflective-api-gateway/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { ApiError } from './errors';

// Define the expected JWT payload structure
interface JwtPayload {
  id: number;
  email: string;
  role: string;
  [key: string]: any; // Allow for additional properties
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
    // Assert 'secret' as string for 'jwt.verify' overload
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Token expired');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid token');
    }

    // Catch any other unexpected errors during verification
    throw new ApiError(500, 'Failed to verify token due to an internal error.');
  }
};