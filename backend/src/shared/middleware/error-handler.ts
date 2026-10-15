import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

export default function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction): void {
  const status = err.status ?? err.statusCode ?? 500;

  logger.error({ err, method: req.method, url: req.url }, 'Unhandled error');

  res.status(status).json({
    message: status === 500 ? 'Internal server error' : err.message,
  });
}
