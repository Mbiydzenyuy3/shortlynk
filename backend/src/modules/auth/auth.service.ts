import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../shared/prisma.js';
import { config } from '../../config/index.js';
import type { RegisterInput, LoginInput } from './auth.validator.js';

function generateToken(user: { id: string; email: string; username: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, username: user.username },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export async function registerUser({ username, email, password }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('Email already used by another user') as Error & { status?: number };
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
    select: { id: true, email: true, username: true },
  });

  const token = generateToken(user);
  return {
    success: true,
    message: 'User registered successfully.',
    token,
    data: { id: user.id, email: user.email, username: user.username },
  };
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    const error = new Error('The password or email is not correct') as Error & { status?: number };
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('The password or email is not correct') as Error & { status?: number };
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);
  return {
    success: true,
    message: 'User logged in successfully.',
    token,
    data: { id: user.id, email: user.email, username: user.username },
  };
}
