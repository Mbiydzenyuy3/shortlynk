import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'development' ? 500 : 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
