// reflective-api-gateway/src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger'; // Use the logger we just created

// Global error handling middleware
const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Handle custom API errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  }

  // Handle other types of errors (e.g., unexpected errors)
  // Log the error for debugging, but don't expose sensitive info to client
  logger.error('Unexpected error:', error);

  // Send a generic 500 Internal Server Error response
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server.',
  });
};

export default errorMiddleware;