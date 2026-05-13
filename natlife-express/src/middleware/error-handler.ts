import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>) {
    super(400, 'Validation failed.', errors);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found.`);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(msg = 'You do not have permission to perform this action.') {
    super(403, msg);
    this.name = 'PermissionError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { detail: err.message };
    if (err.errors) body.errors = err.errors;
    res.status(err.statusCode).json(body);
    return;
  }

  // TypeORM unique violation
  if ((err as NodeJS.ErrnoException).code === '23505') {
    res.status(409).json({ detail: 'A record with these values already exists.' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ detail: 'Internal server error.' });
}
