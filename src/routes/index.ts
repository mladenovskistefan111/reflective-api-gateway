// reflective-api-gateway/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes'; // Routes for Auth Service
// import taskRoutes from './tasks.routes'; // Will be created later for Task Tracker Service
// import insightsRoutes from './insights.routes'; // Will be created later for Insights Engine

const router = Router();

// Mount specific service routes
router.use('/auth', authRoutes); // e.g., /api/auth/register, /api/auth/login, etc.
// router.use('/tasks', taskRoutes); // e.g., /api/tasks, /api/tasks/:id
// router.use('/insights', insightsRoutes); // e.g., /api/insights/weekly-summary

export default router;