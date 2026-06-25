import express from "express";
import { createShortUrl, getUserUrls } from "../controllers/url-controller.js";
import { updateUrl, deleteUrl } from "../controllers/urlUpdate.controller.js";
import { authMiddleware } from "../middlewares/user-auth.middleware.js";
import shortenUrlSchema, { updateUrlSchema } from "../validators/url.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Shorten a long URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShortenRequest'
 *     responses:
 *       200:
 *         description: Short URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortenResponse'
 */

router.post("/", authMiddleware, validate(shortenUrlSchema), createShortUrl);

/**
 * @swagger
 * /api/shorten/my-urls:
 *   get:
 *     summary: Returns all URLs of the logged-in user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user’s URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShortenResponse'
 */

router.get("/my-urls", authMiddleware, getUserUrls);

/**
 * @swagger
 * /api/shorten/{shortCode}:
 *   patch:
 *     summary: Update URL expiry date
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expireAt:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: URL updated successfully
 *       404:
 *         description: URL not found
 */

router.patch("/:shortCode", authMiddleware, validate(updateUrlSchema), updateUrl);

/**
 * @swagger
 * /api/shorten/{shortCode}:
 *   delete:
 *     summary: Delete a shortened URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *       404:
 *         description: URL not found
 */

router.delete("/:shortCode", authMiddleware, deleteUrl);

export default router;
