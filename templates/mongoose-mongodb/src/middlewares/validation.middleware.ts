import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { HttpException } from '@exceptions/http.exception';
import type { ValidationErrorDetail } from '@interfaces/error.interface';

export function ValidationMiddleware(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Express 5.x: body parser가 없거나 Content-Type이 맞지 않으면 req.body는 undefined
    if (req.body === null || req.body === undefined) {
      return next(new HttpException(400, 'Request body is required'));
    }

    if (typeof req.body === 'object' && Object.keys(req.body).length === 0) {
      return next(new HttpException(400, 'Invalid JSON format or empty body'));
    }

    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details: ValidationErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      const message = details.map((d) => d.message).join(', ');
      return next(new HttpException(400, message, details));
    }

    req.body = result.data;
    next();
  };
}
