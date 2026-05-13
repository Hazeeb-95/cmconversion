import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './error-handler';

type ClassConstructor<T> = new (...args: unknown[]) => T;

export function validateBody<T extends object>(cls: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(cls, req.body);
    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const formatted: Record<string, string[]> = {};
      for (const e of errors) {
        formatted[e.property] = Object.values(e.constraints ?? {});
      }
      next(new ValidationError(formatted));
      return;
    }

    req.body = instance;
    next();
  };
}
