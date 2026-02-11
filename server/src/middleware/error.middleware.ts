import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // 2. Handle known operational errors (like Prisma unique constraint)
  if ('code' in err && err.code === 'P2002') {
    return res.status(409).json({
      status: 'fail',
      message: 'Action could not be completed', // Cryptic message
    });
  }

  // 3. Fallback for unknown internal errors
  console.error('Unexpected Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server processing error',
  });
};
