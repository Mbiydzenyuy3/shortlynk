import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3, 'Name should have at least 3 characters').max(30, 'Name should have at most 30 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string()
    .min(6, 'Password should have at least 6 characters')
    .max(30, 'Password should have at most 30 characters')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must include at least one special character'),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
