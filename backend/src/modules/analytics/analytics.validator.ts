import { z } from 'zod';

export const shortCodeParamSchema = z.object({
  shortCode: z.string().min(4).max(30).regex(/^[a-zA-Z0-9\-_]+$/),
});

export type ShortCodeParam = z.infer<typeof shortCodeParamSchema>;
