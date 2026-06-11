/**
 * Consistent Error Handling
 * Standardizes error handling across services and API calls
 */

import { ApiResponse } from '@/types'
import { logger } from '@/lib/logger'

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Handle errors and return consistent ApiResponse
 */
export function handleError<T>(
  error: unknown,
  context: string,
  defaultMessage: string = 'An error occurred'
): ApiResponse<T> {
  if (error instanceof AppError) {
    logger.error(error.message, undefined, context)
    return {
      error: error.message,
      data: undefined,
    }
  }

  if (error instanceof Error) {
    logger.error(error.message, error, context)
    return {
      error: error.message,
      data: undefined,
    }
  }

  const message = typeof error === 'string' ? error : defaultMessage
  logger.error(message, undefined, context)

  return {
    error: message,
    data: undefined,
  }
}

/**
 * Validate and throw AppError
 */
export function validate<T>(
  condition: boolean,
  code: ErrorCode,
  message: string,
  details?: Record<string, any>
): asserts condition {
  if (!condition) {
    throw new AppError(code, message, 400, details)
  }
}

/**
 * Safe async handler that catches errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string,
  defaultError: string = 'Operation failed'
): Promise<ApiResponse<T>> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    return handleError<T>(error, context, defaultError)
  }
}

/**
 * Safe sync handler that catches errors
 */
export function safeSync<T>(
  fn: () => T,
  context: string,
  defaultError: string = 'Operation failed'
): ApiResponse<T> {
  try {
    const data = fn()
    return { data }
  } catch (error) {
    return handleError<T>(error, context, defaultError)
  }
}
