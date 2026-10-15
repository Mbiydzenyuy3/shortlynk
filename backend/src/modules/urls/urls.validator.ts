import { z } from 'zod';

export const shortenUrlSchema = z.object({
  longUrl: z.string().url('The provided long URL is malformed or invalid.').max(2048, 'The longUrl must be 2048 characters or fewer.'),
  shortCode: z.string()
    .min(4, 'Custom alias must be at least 4 characters long.')
    .max(30, 'Custom alias cannot exceed 30 characters.')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Custom alias can only contain letters, numbers, hyphens (-), and underscores (_).')
    .optional(),
  expiresAt: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
});

export const guestShortenSchema = z.object({
  longUrl: z.string().url('The provided long URL is malformed or invalid.').max(2048, 'The longUrl must be 2048 characters or fewer.'),
});

export const updateUrlSchema = z.object({
  expireAt: z.string().datetime({ offset: true }).nullable().optional().or(z.string().date().nullable().optional()),
});

export type ShortenUrlInput = z.infer<typeof shortenUrlSchema>;
export type UpdateUrlInput = z.infer<typeof updateUrlSchema>;
