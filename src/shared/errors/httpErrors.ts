import { AppError } from './AppError.js';

export const badRequest = (message = 'Bad request', code = 'BAD_REQUEST') =>
  new AppError(message, 400, code);

export const unauthorized = (message = 'Authentication required', code = 'UNAUTHORIZED') =>
  new AppError(message, 401, code);

export const forbidden = (message = 'Forbidden', code = 'FORBIDDEN') =>
  new AppError(message, 403, code);

export const conflict = (message = 'Conflict', code = 'CONFLICT') =>
  new AppError(message, 409, code);

export const notFound = (message = 'Not found', code = 'NOT_FOUND') =>
  new AppError(message, 404, code);

export const tooManyRequests = (retryAfterSeconds: number) =>
  new AppError('Too many attempts', 429, 'RATE_LIMITED', retryAfterSeconds);
