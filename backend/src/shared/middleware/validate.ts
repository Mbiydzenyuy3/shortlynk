import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = result.error as ZodError;
      const message = error.errors[0]?.message ?? 'Validation failed';
      res.status(400).json({ success: false, message });
      return;
    }
    req.body = result.data;
    next();
  };
}
