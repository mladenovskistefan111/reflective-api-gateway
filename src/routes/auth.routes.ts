// reflective-api-gateway/src/routes/auth.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import config from '../config/index';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/errors';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const AUTH_SERVICE_URL = config.authServiceUrl;

/**
 * Helper function to proxy requests to the Auth service
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 * @param endpoint Specific endpoint on the Auth service (e.g., '/register', '/login')
 * @param method HTTP method (e.g., 'post', 'get')
 * @param protectedRoute Boolean indicating if the route requires JWT validation
 */
const proxyAuthService = async (
  req: Request,
  res: Response,
  next: NextFunction,
  endpoint: string,
  method: 'get' | 'post' | 'put' | 'delete',
  protectedRoute: boolean = false
): Promise<void> => {
  try {
    let headers = { ...req.headers };
    delete headers.host;
    // CRUCIAL FIX: Delete Content-Length header to prevent "request aborted" errors
    // Axios will automatically set the correct Content-Length based on `data`
    delete headers['content-length'];

    // If it's a protected route, ensure authMiddleware has run and attach user ID if available
    if (protectedRoute && req.user) {
      headers['X-User-ID'] = req.user.id.toString(); // Convert number to string
      headers['X-User-Email'] = req.user.email;
      headers['X-User-Role'] = req.user.role;
    } else if (protectedRoute && !req.user) {
      // This case should ideally be caught by authMiddleware before proxying, but as a safeguard:
      throw new ApiError(401, 'Authentication required for this route.');
    }

    const authServiceResponse = await axios({
      method: method,
      url: `${AUTH_SERVICE_URL}${endpoint}`,
      data: req.body,
      params: req.query,
      headers: headers,
      validateStatus: (status) => true, // Accept all status codes and handle them in the try/catch
    });

    // Forward the response status and data from the Auth service back to the client
    res.status(authServiceResponse.status).json(authServiceResponse.data);

  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      // If it's an Axios error and we got a response from the Auth service,
      // forward that response (e.g., 400 Bad Request, 401 Unauthorized from Auth service)
      res.status(error.response.status).json(error.response.data);
    } else if (error instanceof ApiError) {
      // If it's a custom ApiError (e.g., from authMiddleware validation), pass to global error handler
      next(error);
    } else if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      // Specific error for connection refused (Auth service not running or wrong URL)
      next(new ApiError(503, 'Auth service is currently unavailable.'));
    } else {
      // General network error or other unexpected error during proxying
      next(new ApiError(500, 'Failed to connect to authentication service.'));
    }
  }
};

// === Public Routes (no JWT validation needed on Gateway) ===

// Register a new user
router.post('/register', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/api/auth/register', 'post')
));

// Authenticate user & get token
router.post('/login', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/api/auth/login', 'post')
));

// Refresh access token
router.post('/refresh', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/api/auth/refresh', 'post')
));

// Verify email with token
router.get('/verify-email/:token', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, `/api/auth/verify-email/${req.params.token}`, 'get')
));

// Request password reset email
router.post('/forgot-password', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/api/auth/forgot-password', 'post')
));

// Reset password with token
router.post('/reset-password/:token', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, `/api/auth/reset-password/${req.params.token}`, 'post')
));

// === Protected Routes (require JWT validation on Gateway) ===

// Get current user profile
router.get('/me', authMiddleware, catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/api/auth/me', 'get', true)
));

// Logout user
router.post('/logout', authMiddleware, catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/api/auth/logout', 'post', true)
));

export default router;