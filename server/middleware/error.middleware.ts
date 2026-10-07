import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err.message, err.stack);

  // Prisma errors
  if (err.code === 'P2002') {
    res.status(409).json({ error: 'Resource already exists', detail: err.message });
    return;
  }
  if (err.code === 'P2025') {
    res.status(404).json({ error: 'Resource not found', detail: err.message });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
