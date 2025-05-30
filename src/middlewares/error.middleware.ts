
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';


const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;


  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  }

  logger.error('Unexpected error:', error);

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server.',
  });
};

export default errorMiddleware;