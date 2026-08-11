/**
 * Comprehensive Error Handling and Logging System
 *
 * This module provides:
 * - Custom error classes for different error types
 * - Centralized error handling
 * - Structured logging
 * - Error tracking integration
 * - Proper HTTP error responses
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import React from 'react';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, metadata);
  }
}

/**
 * Authentication error for failed auth
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', metadata?: Record<string, any>) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, metadata);
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', metadata?: Record<string, any>) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, metadata);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', metadata?: Record<string, any>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, metadata);
  }
}

/**
 * Conflict error for duplicate resources
 */
export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 409, 'CONFLICT_ERROR', true, metadata);
  }
}

/**
 * Rate limit error for exceeded limits
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number,
    metadata?: Record<string, any>
  ) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, metadata);
  }
}

/**
 * Payment error for failed transactions
 */
export class PaymentError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 400, 'PAYMENT_ERROR', true, metadata);
  }
}

/**
 * Database error for database operations
 */
export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', true, metadata);
  }
}

/**
 * External service error for third-party integrations
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    metadata?: Record<string, any>
  ) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, { service, ...metadata });
  }
}

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private context: Record<string, any> = {};

  /**
   * Add context to all log entries
   */
  withContext(context: Record<string, any>): Logger {
    const logger = new Logger();
    logger.context = { ...this.context, ...context };
    return logger;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error | AppError
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error instanceof AppError ? error.code : undefined,
          }
        : undefined,
    };
  }

  /**
   * Log at debug level
   */
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message);
    if (context) {
      entry.context = { ...entry.context, ...context };
    }
    this.writeLog(entry);
  }

  /**
   * Log at info level
   */
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message);
    if (context) {
      entry.context = { ...entry.context, ...context };
    }
    this.writeLog(entry);
  }

  /**
   * Log at warn level
   */
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message);
    if (context) {
      entry.context = { ...entry.context, ...context };
    }
    this.writeLog(entry);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, error);
    if (context) {
      entry.context = { ...entry.context, ...context };
    }
    this.writeLog(entry);
  }

  /**
   * Log at fatal level
   */
  fatal(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, error);
    if (context) {
      entry.context = { ...entry.context, ...context };
    }
    this.writeLog(entry);
  }

  /**
   * Write log entry to appropriate destination
   */
  private writeLog(entry: LogEntry): void {
    const logMessage = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV !== 'production') {
          console.debug(logMessage);
        }
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        break;
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Format log entry for console output
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? ` | ${entry.error.name}: ${entry.error.message}` : '';

    return `[${timestamp}] [${level}] ${entry.message}${error}${context}`;
  }

  /**
   * Send log entry to external logging service
   */
  private sendToLoggingService(entry: LogEntry): void {
    // TODO: Integrate with logging service (Sentry, LogRocket, DataDog, etc.)
    // This is where you would send logs to your production logging service
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      // Send critical errors to error tracking service
      // Sentry.captureException(entry.error);
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Error handler middleware for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the error
  logger.error('API Error occurred', error instanceof Error ? error : new Error(String(error)));

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.issues,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    const response: any = {
      error: error.message,
      code: error.code,
    };

    // Add metadata if present
    if (error.metadata) {
      response.metadata = error.metadata;
    }

    // Add retry-after for rate limit errors
    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production') {
      response.stack = error.stack;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  // Don't expose internal errors in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : errorMessage;

  return NextResponse.json(
    {
      error: message,
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API route handlers
 *
 * @param handler - API route handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Request context for logging
 */
export interface RequestContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

/**
 * Create a logger with request context
 */
export function createRequestLogger(context: RequestContext): Logger {
  return logger.withContext(context);
}

/**
 * Error boundary for React components
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return React.createElement(
        "div",
        { className: "min-h-screen flex items-center justify-center bg-gray-50" },
        React.createElement(
          "div",
          { className: "max-w-md w-full bg-white rounded-lg shadow-lg p-8" },
          React.createElement("h1", { className: "text-2xl font-bold text-gray-900 mb-4" }, "Something went wrong"),
          React.createElement(
            "p",
            { className: "text-gray-600 mb-6" },
            "We apologize for the inconvenience. Please try again later."
          ),
          React.createElement(
            "button",
            {
              onClick: () => window.location.reload(),
              className: "w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition",
            },
            "Reload Page"
          )
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Retry utility for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = (error) => error instanceof AppError && error.statusCode >= 500,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      logger.warn(`Retrying operation (attempt ${attempt}/${maxAttempts})`, {
        delay,
        error: lastError.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker for external service calls
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeoutMs: number = 60000,
    private service: string
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime.getTime() > this.timeoutMs) {
        this.state = 'half-open';
        logger.info(`Circuit breaker for ${this.service} entering half-open state`);
      } else {
        throw new ExternalServiceError(
          this.service,
          'Service circuit breaker is open'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      logger.error(`Circuit breaker for ${this.service} opened after ${this.failureCount} failures`);
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
    this.lastFailureTime = undefined;
  }
}