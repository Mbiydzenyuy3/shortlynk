import express from 'express';
import { createGuestShortUrl } from '../controllers/guestUrl.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import shortenUrlSchema from '../validators/url.validator.js';

const router = express.Router();

router.post('/', validate(shortenUrlSchema), createGuestShortUrl);

export default router;
