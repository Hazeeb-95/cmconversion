import 'reflect-metadata';
import 'express-async-errors';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import accountsRouter from './modules/accounts/routes';
import coreRouter from './modules/core/routes';
import shgRouter from './modules/shg/routes';
import trainerRouter from './modules/trainer/routes';
import applicationsRouter from './modules/applications/routes';
import adminRouter from './modules/admin/routes';
import websiteRouter from './modules/website/routes';
import { globalErrorHandler } from './middleware/error-handler';

export function createApp(): Application {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:8080'];

  app.use(
    cors({
      origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'ngrok-skip-browser-warning',
        'x-session-token',
        'x-client-id',
      ],
    }),
  );

  // ── Body Parsing ──────────────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Static Media (local dev) ───────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    app.use('/media', express.static(path.join('/tmp', 'uploads')));
  }

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get('/health/', (_req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV });
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/accounts', accountsRouter);
  app.use('/', coreRouter);
  app.use('/partners', shgRouter);
  app.use('/trainer', trainerRouter);
  app.use('/applications', applicationsRouter);
  app.use('/admin', adminRouter);
  app.use('/web', websiteRouter);

  // ── 404 Handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ detail: 'Not found.' });
  });

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.use(globalErrorHandler);

  return app;
}
