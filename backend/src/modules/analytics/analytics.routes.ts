import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.js';
import * as AnalyticsController from './analytics.controller.js';

const router = Router();

// Short links must not be indexed
router.get('/:shortCode', (req: Request, res: Response, next: NextFunction) => {
  res.set('X-Robots-Tag', 'noindex');
  next();
}, AnalyticsController.redirectToUrl);

router.get('/:shortCode/stats', authMiddleware, AnalyticsController.getUrlStats);
router.get('/:shortCode/sources', authMiddleware, AnalyticsController.getClickSources);

export default router;
