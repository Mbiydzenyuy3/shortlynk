import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../shared/prisma.js';
import { config } from '../../config/index.js';
import { AppError } from '../../shared/utils/app-error.js';
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
    throw new AppError('Email already used by another user', 409);
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
    throw new AppError('The password or email is not correct', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('The password or email is not correct', 401);
  }

  const token = generateToken(user);
  return {
    success: true,
    message: 'User logged in successfully.',
    token,
    data: { id: user.id, email: user.email, username: user.username },
  };
}
