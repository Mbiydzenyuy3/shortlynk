import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './auth.validator.js';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should accept valid input', () => {
      const result = registerSchema.safeParse({
        username: 'testuser',
        email: 'test@example.com',
        password: 'pass!123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short username', () => {
      const result = registerSchema.safeParse({
        username: 'ab',
        email: 'test@example.com',
        password: 'pass!123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = registerSchema.safeParse({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        username: 'testuser',
        email: 'not-an-email',
        password: 'pass!123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid input', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });
  });
});
