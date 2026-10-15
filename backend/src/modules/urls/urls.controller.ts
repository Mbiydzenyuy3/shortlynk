import type { Request, Response } from 'express';
import * as UrlService from './urls.service.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

export async function createShortUrl(req: Request, res: Response): Promise<void> {
  const { longUrl, shortCode, expiresAt } = req.body;
  const userId = (req as AuthenticatedRequest).user.id;

  try {
    const result = await UrlService.createShortUrl({
      longUrl,
      shortCode: shortCode ?? null,
      expireAt: expiresAt ?? null,
      userId,
    });

    res.status(201).json({
      message: 'Short URL created successfully',
      ...result,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNSAFE_URL') {
        res.status(400).json({
          success: false,
          message: 'This URL has been flagged as unsafe and cannot be shortened.',
        });
        return;
      }
      if (err.message.includes('conflict') || err.message.includes('Conflict')) {
        res.status(409).json({ message: 'Custom code already in use' });
        return;
      }
    }
    throw err;
  }
}

export async function createGuestShortUrl(req: Request, res: Response): Promise<void> {
  const { longUrl } = req.body;

  try {
    const result = await UrlService.createShortUrl({
      longUrl,
      shortCode: null,
      expireAt: null,
      userId: null,
    });

    res.status(201).json({
      message: 'Short URL created successfully',
      shortened_URL: result.shortUrl,
      short_code: result.shortCode,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNSAFE_URL') {
      res.status(400).json({
        success: false,
        message: 'This URL has been flagged as unsafe and cannot be shortened.',
      });
      return;
    }
    throw err;
  }
}

export async function getUserUrls(req: Request, res: Response): Promise<void> {
  const urls = await UrlService.getUserUrls((req as AuthenticatedRequest).user.id);
  res.status(200).json({ urls });
}

export async function updateUrl(req: Request, res: Response): Promise<void> {
  const shortCode = req.params.shortCode as string;
  const { expireAt } = req.body;
  const userId = (req as AuthenticatedRequest).user.id;

  const result = await UrlService.updateUrlExpiry(shortCode, userId, expireAt ?? null);

  if (!result) {
    res.status(404).json({ success: false, message: 'URL not found.' });
    return;
  }

  res.status(200).json({ success: true, data: result });
}

export async function deleteUrl(req: Request, res: Response): Promise<void> {
  const shortCode = req.params.shortCode as string;
  const userId = (req as AuthenticatedRequest).user.id;

  const deleted = await UrlService.deleteUrl(shortCode, userId);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'URL not found.' });
    return;
  }

  res.status(200).json({ success: true, message: 'URL deleted.' });
}
