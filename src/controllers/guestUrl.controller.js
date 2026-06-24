import * as UrlServices from '../services/urls.service.js';
import { logError } from '../utils/logger.js';

export const createGuestShortUrl = async (req, res) => {
  const { longUrl } = req.body;

  try {
    const result = await UrlServices.createShortUrlService({
      longUrl,
      shortCode: null,
      expireAt: null,
      userId: null,
    });

    res.status(201).json({
      message: 'Short URL created successfully',
      shortened_URL: result.short_url,
      short_code: result.short_code,
    });
  } catch (err) {
    logError('Error creating guest short URL:', err);
    res.status(500).json({ message: 'Server error creating short URL' });
  }
};
