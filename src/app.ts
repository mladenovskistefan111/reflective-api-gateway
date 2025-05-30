import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import errorMiddleware from './middlewares/error.middleware.js';
import mainRoutes from './routes/index.js';
import { authMiddleware } from './middlewares/auth.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

app.use('/api/auth', mainRoutes.auth);
app.use('/api/goals', authMiddleware, mainRoutes.goals);

app.use(errorMiddleware);

export default app;