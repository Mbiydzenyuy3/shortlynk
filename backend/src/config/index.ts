import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  GOOGLE_SAFE_BROWSING_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const config = envSchema.parse(process.env);
