import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import config from '../config/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/errors.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

const AUTH_SERVICE_URL = config.authServiceUrl;

/**
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 * @param endpoint Specific endpoint on the Auth service
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

    delete headers['content-length'];

    if (protectedRoute && req.user) {
      headers['X-User-ID'] = req.user.id.toString(); 
      headers['X-User-Email'] = req.user.email;
      headers['X-User-Role'] = req.user.role;
    } else if (protectedRoute && !req.user) {

      throw new ApiError(401, 'Authentication required for this route.');
    }

    const authServiceResponse = await axios({
      method: method,
      url: `${AUTH_SERVICE_URL}${endpoint}`,
      data: req.body,
      params: req.query,
      headers: headers,
      validateStatus: (status) => true
    });

    res.status(authServiceResponse.status).json(authServiceResponse.data);

  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error instanceof ApiError) {
      next(error);
    } else if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      next(new ApiError(503, 'Auth service is currently unavailable.'));
    } else {
      next(new ApiError(500, 'Failed to connect to authentication service.'));
    }
  }
};

// === Public Routes (no JWT validation needed on Gateway) ===
router.get('/health', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/auth/health', 'get', false)
));

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

// Verify email with token NOT IMPLEMENTED
router.get('/verify-email/:token', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, `/api/auth/verify-email/${req.params.token}`, 'get')
));

// Request password reset email NOT IMPLEMENTED
router.post('/forgot-password', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyAuthService(req, res, next, '/api/auth/forgot-password', 'post')
));

// Reset password with token NOT IMPLEMENTED
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