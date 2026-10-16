import rateLimit from 'express-rate-limit';
import { config } from '../../config/index.js';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.NODE_ENV === 'development' ? 500 : 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
