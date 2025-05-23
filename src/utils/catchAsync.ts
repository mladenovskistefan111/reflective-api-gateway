// reflective-api-gateway/src/utils/catchAsync.ts
import { Request, Response, NextFunction } from 'express';

// A utility function to wrap async Express middleware/controller functions
// It catches any errors and passes them to the next middleware (error handler)
export const catchAsync = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};