import express from 'express'
import {
  getRedirectUrl,
  getUrlStats,
} from '../controllers/redirecturl-controller.js'
import { authMiddleware } from '../middlewares/user-auth.middleware.js'

const router = express.Router()

/**
 * @swagger
 * /s/{shortCode}:
 *   get:
 *     summary: Redirects to the original long URL
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The short code of the shortened URL
 *     responses:
 *       302:
 *         description: Redirect to long URL
 *       404:
 *         description: URL not found
 */

router.get('/:shortCode', getRedirectUrl)

/**
 * @swagger
 * /s/{shortCode}/stats:
 *   get:
 *     summary: Provides stats (like click count) for a short URL
 *     tags: [Redirect]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The short code of the shortened URL
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Short URL not found
 */
router.get('/:shortCode/stats', authMiddleware, getUrlStats)

export default router
