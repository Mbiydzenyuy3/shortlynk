import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { config } from './config/index.js';
import logger from './shared/utils/logger.js';
import { limiter } from './shared/middleware/rate-limit.js';
import errorHandler from './shared/middleware/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';
import urlRoutes from './modules/urls/urls.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';

const app = express();

app.set('trust proxy', 1);

// Security
app.use(helmet());
app.disable('x-powered-by');

// Rate limiting
app.use(limiter);

// Logging
app.use(pinoHttp({ logger, autoLogging: config.NODE_ENV !== 'test' }));

// CORS
app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = [
      config.FRONTEND_URL.replace(/\/$/, ''),
      'https://shortlynk.store',
      'https://www.shortlynk.store',
      'http://localhost:5173',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// API host robots.txt — must not be indexed
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Root route
app.get('/', (_req, res) => {
  res.json({ message: 'Shortlynk API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', authRoutes);  // backwards compat with frontend
app.use('/api/shorten', urlRoutes);
app.use('/s', analyticsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
