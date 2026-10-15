import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { shortenUrlSchema, guestShortenSchema, updateUrlSchema } from './urls.validator.js';
import * as UrlController from './urls.controller.js';

const router = Router();

router.post('/guest', validate(guestShortenSchema), UrlController.createGuestShortUrl);
router.post('/', authMiddleware, validate(shortenUrlSchema), UrlController.createShortUrl);
router.get('/my-urls', authMiddleware, UrlController.getUserUrls);
router.patch('/:shortCode', authMiddleware, validate(updateUrlSchema), UrlController.updateUrl);
router.delete('/:shortCode', authMiddleware, UrlController.deleteUrl);

export default router;
