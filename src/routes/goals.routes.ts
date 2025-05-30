import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import config from '../config/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/errors.js';

const router = Router();

const GOAL_SERVICE_URL = config.goalServiceUrl;


const proxyGoalService = async (
  req: Request,
  res: Response,
  next: NextFunction,
  endpoint: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
): Promise<void> => {
  try {
    let headers = { ...req.headers };

    delete headers.host;
    delete headers['content-length'];


    if (req.user?.id) {
      headers['x-user-id'] = req.user.id.toString();
    } else {
      throw new ApiError(401, 'Authentication required: User ID not found in token.');
    }

    console.log(`Proxying ${method.toUpperCase()} request to: ${GOAL_SERVICE_URL}${endpoint}`);

    const goalServiceResponse = await axios({
      method: method,
      url: `${GOAL_SERVICE_URL}${endpoint}`,
      data: req.body,
      params: req.query,
      headers: headers,
      validateStatus: (status) => true, 
    });

    console.log(`Goal service responded with status: ${goalServiceResponse.status}`);

  
    res.status(goalServiceResponse.status).json(goalServiceResponse.data);

  } catch (error: any) {
    console.error('Error in proxyGoalService:', error.message);
    
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error instanceof ApiError) {
      next(error);
    } else if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      next(new ApiError(503, 'Goal service is currently unavailable.'));
    } else {
      console.error('Full error details:', error);
      next(new ApiError(500, 'Failed to connect to goal service.'));
    }
  }
};

// === Goal Service Routes ===
// All routes are protected by authMiddleware applied in app.ts

// Health check
router.get('/health', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyGoalService(req, res, next, '/health', 'get')
));

// Get all goals for the authenticated user
router.get('/', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyGoalService(req, res, next, '/api/goals', 'get')
));

// Get a single goal by ID
router.get('/:id', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyGoalService(req, res, next, `/api/goals/${req.params.id}`, 'get')
));

// Create a new goal
router.post('/', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyGoalService(req, res, next, '/api/goals', 'post')
));

// Update a goal (partial update)
router.patch('/:id', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyGoalService(req, res, next, `/api/goals/${req.params.id}`, 'patch')
));

// Mark goal as complete/incomplete
router.patch('/:id/complete', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyGoalService(req, res, next, `/api/goals/${req.params.id}/complete`, 'patch')
));

// Delete a goal
router.delete('/:id', catchAsync(async (req: Request, res: Response, next: NextFunction) =>
  proxyGoalService(req, res, next, `/api/goals/${req.params.id}`, 'delete')
));

export default router;