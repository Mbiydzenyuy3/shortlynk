import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import * as AuthService from './auth.service.js';
import { config } from '../../config/index.js';
import prisma from '../../shared/prisma.js';
import logger from '../../shared/utils/logger.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await AuthService.registerUser(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await AuthService.loginUser(req.body);
  res.status(200).json(result);
}

export function logout(req: Request, res: Response): void {
  const userId = (req as AuthenticatedRequest).user?.id ?? 'Unknown';
  logger.info({ userId }, 'Logout requested');
  res.json({ message: 'Logout successful. Please discard your token.' });
}

function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );
}

function generateOAuthState(): string {
  return jwt.sign({ createdAt: Date.now() }, config.JWT_SECRET, { expiresIn: '45m' });
}

function verifyOAuthState(stateToken: string): boolean {
  try {
    jwt.verify(stateToken, config.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function googleAuthRedirect(req: Request, res: Response): void {
  const oauth2Client = createOAuth2Client();
  const state = generateOAuthState();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_SCOPES,
    response_type: 'code',
    include_granted_scopes: true,
    state,
    prompt: 'consent',
    redirect_uri: config.GOOGLE_REDIRECT_URI,
  });

  res.redirect(authUrl);
}

export async function googleAuthCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!state || !verifyOAuthState(state)) {
    res.status(400).send('Invalid OAuth state.');
    return;
  }

  if (!code) {
    res.status(400).send('Missing authorization code.');
    return;
  }

  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const { data: userInfo } = await oauth2.userinfo.get();

  if (!userInfo.email) {
    res.status(400).send('Could not retrieve email from Google.');
    return;
  }

  let user = await prisma.user.findUnique({ where: { email: userInfo.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userInfo.email,
        username: userInfo.name ?? userInfo.email.split('@')[0],
        password: null,  // OAuth users have no password
      },
    });
  }

  const jwtToken = jwt.sign(
    { sub: user.id, email: user.email, username: user.username },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  logger.info({ email: user.email }, 'Google OAuth successful');

  const redirectUrl = `${config.FRONTEND_URL}/oauth/callback?token=${jwtToken}`;
  res.redirect(redirectUrl);
}
