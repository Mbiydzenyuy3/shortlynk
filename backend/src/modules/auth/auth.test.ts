import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock Prisma
vi.mock('../../shared/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock config
vi.mock('../../config/index.js', () => ({
  config: {
    JWT_SECRET: 'a'.repeat(32),
    JWT_EXPIRES_IN: '1h',
  },
}));

import prisma from '../../shared/prisma.js';
import { registerUser, loginUser } from './auth.service.js';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed',
        createdAt: new Date(),
      });

      const result = await registerUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password!123',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.data.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-uuid',
        email: 'test@example.com',
        username: 'existing',
        password: 'hashed',
        createdAt: new Date(),
      });

      await expect(
        registerUser({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password!123',
        })
      ).rejects.toThrow('Email already used');
    });
  });

  describe('loginUser', () => {
    it('should login with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password!123', 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        createdAt: new Date(),
      });

      const result = await loginUser({
        email: 'test@example.com',
        password: 'password!123',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correct!pass', 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        createdAt: new Date(),
      });

      await expect(
        loginUser({ email: 'test@example.com', password: 'wrong!pass' })
      ).rejects.toThrow('password or email is not correct');
    });

    it('should reject non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        loginUser({ email: 'noone@example.com', password: 'pass!123' })
      ).rejects.toThrow('password or email is not correct');
    });
  });
});
