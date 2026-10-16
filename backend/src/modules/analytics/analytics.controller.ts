import type { Request, Response } from 'express';
import * as AnalyticsService from './analytics.service.js';
import logger from '../../shared/utils/logger.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

export async function redirectToUrl(req: Request, res: Response): Promise<void> {
  const shortCode = req.params.shortCode as string;
  const result = await AnalyticsService.handleRedirect(shortCode, req);

  if (result.status === 'not_found') {
    res.status(404).json({ message: 'Short URL not found' });
    return;
  }

  if (result.status === 'expired') {
    res.status(410).json({ message: 'This short URL has expired' });
    return;
  }

  logger.info({ redirectTo: result.redirectTo, clicks: result.clicks }, 'Redirecting');
  res.redirect(302, result.redirectTo!);
}

export async function getUrlStats(req: Request, res: Response): Promise<void> {
  const stats = await AnalyticsService.getUrlStats(
    req.params.shortCode as string,
    (req as AuthenticatedRequest).user.id
  );

  if (!stats) {
    res.status(404).json({ message: 'Stats not found or unauthorized' });
    return;
  }

  res.status(200).json(stats);
}

export async function getClickSources(req: Request, res: Response): Promise<void> {
  const sources = await AnalyticsService.getClickSources(
    req.params.shortCode as string,
    (req as AuthenticatedRequest).user.id
  );

  if (!sources) {
    res.status(404).json({ message: 'URL not found or unauthorized' });
    return;
  }

  res.status(200).json({ success: true, data: sources });
}
