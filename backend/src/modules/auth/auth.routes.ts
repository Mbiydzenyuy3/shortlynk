import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { registerSchema, loginSchema } from './auth.validator.js';
import * as AuthController from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/google', AuthController.googleAuthRedirect);
router.get('/google/callback', AuthController.googleAuthCallback);

export default router;
