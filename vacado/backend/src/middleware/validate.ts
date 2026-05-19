import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/** Validates req.body against a Zod schema, replacing it with the parsed value. */
export const validateBody =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
