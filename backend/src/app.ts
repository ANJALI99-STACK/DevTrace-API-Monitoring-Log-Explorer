import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import endpointRoutes from './routes/endpointRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import logRoutes from './routes/logRoutes';
import alertRoutes from './routes/alertRoutes';
import exportRoutes from './routes/exportRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [
        'http://localhost:5173',
        'https://dev-trace-api-monitoring-log-explor.vercel.app',
      ],
      credentials: true,
    })
  );
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'devtrace-api' }));

  app.use('/auth', authRoutes);
  app.use('/user', userRoutes);
  app.use('/endpoints', endpointRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/logs', logRoutes);
  app.use('/alerts', alertRoutes);
  app.use('/export', exportRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
