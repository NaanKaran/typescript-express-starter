import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { NODE_ENV } from '@config/env';
import { HttpException } from '@exceptions/http.exception';
import {
  type StandardErrorResponse,
  type ValidationErrorDetail,
  HTTP_ERROR_MESSAGES,
} from '@interfaces/error.interface';
import { logger } from '@utils/logger';

const hasName = (e: unknown, name: string): boolean => e instanceof Error && e.name === name;

/** MongoDB duplicate key error (E11000) */
const isDuplicateKeyError = (e: unknown): e is Error & { keyValue?: Record<string, unknown> } =>
  typeof e === 'object' && e !== null && (e as { code?: unknown }).code === 11000;

const toHttpException = (err: unknown): HttpException => {
  if (err instanceof HttpException) return err;

  if (err instanceof ZodError) {
    const details: ValidationErrorDetail[] = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return new HttpException(400, 'Validation failed', details);
  }

  // Mongoose 스키마 검증 실패
  if (err instanceof mongoose.Error.ValidationError) {
    const details: ValidationErrorDetail[] = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new HttpException(400, 'Validation failed', details);
  }

  // 잘못된 ObjectId 등 타입 캐스팅 실패
  if (err instanceof mongoose.Error.CastError) {
    return new HttpException(400, `Invalid value for "${err.path}"`);
  }

  // unique 인덱스 위반
  if (isDuplicateKeyError(err)) {
    const fields = Object.keys(err.keyValue ?? {});
    return new HttpException(409, `Duplicate value for ${fields.join(', ') || 'unique field'}`);
  }

  if (hasName(err, 'TokenExpiredError')) return new HttpException(401, 'Token expired');
  if (hasName(err, 'JsonWebTokenError')) return new HttpException(401, 'Invalid token');

  const e = err as Error | undefined;
  return new HttpException(500, e?.message || 'Internal Server Error');
};

export const ErrorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const httpErr = toHttpException(error);
  const status = httpErr.status || 500;
  const message =
    httpErr.message ||
    HTTP_ERROR_MESSAGES[status as keyof typeof HTTP_ERROR_MESSAGES] ||
    'Something went wrong';

  if (res.headersSent) return next(httpErr);

  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(
    `[${req.method}] ${req.originalUrl} | ${status} | ${message}${
      status >= 500 && stack ? `\n${stack}` : ''
    }`,
  );

  const errorResponse: StandardErrorResponse = {
    success: false,
    error: {
      code: status,
      // 프로덕션에서는 내부 에러 메시지 노출 방지
      message: status >= 500 && NODE_ENV === 'production' ? HTTP_ERROR_MESSAGES[500] : message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  };

  if (typeof httpErr.data !== 'undefined') {
    errorResponse.error.details = httpErr.data;
  }

  if (NODE_ENV === 'development' && stack) {
    const details = errorResponse.error.details;
    errorResponse.error.details = Array.isArray(details)
      ? { errors: details, stack }
      : { ...(typeof details === 'object' && details !== null ? details : {}), stack };
  }

  res.status(status).json(errorResponse);
};
