import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import prisma from '../prisma.js';
import logger from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ message: 'Authorization token missing.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (!decoded || typeof decoded !== 'object') {
      res.status(401).json({ message: 'Invalid token structure.' });
      return;
    }

    const userId = (decoded as jwt.JwtPayload).sub ?? (decoded as Record<string, unknown>).id;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ message: 'Invalid token payload.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    (req as AuthenticatedRequest).user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token has expired.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }
    logger.error({ err: error }, 'Auth middleware: token verification failed');
    res.status(500).json({ message: 'Server error during token verification.' });
  }
}
