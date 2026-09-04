import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RequestContextService } from '../middleware/request-context.service';

const SILENT_NOT_FOUND_PATHS = new Set(['/', '/favicon.ico', '/favicon.png', '/robots.txt']);

function sanitizeErrorMessage(msg: unknown, status?: number): string {
  if (!msg) {
    if (status === 401) return 'Unable to sign you in. Please check your details and try again.';
    if (status === 403) return "You don't have permission to perform this action.";
    if (status === 404) return 'The requested information could not be found.';
    return 'Something went wrong. Please try again later.';
  }

  const str = typeof msg === 'string' ? msg : String(msg);
  const lower = str.toLowerCase();

  const techKeywords = [
    'prisma',
    'this.prisma',
    'findfirst',
    'findmany',
    'findunique',
    'findraw',
    'aggregate',
    'groupby',
    'can\'t reach database',
    'database server',
    'supabase.co',
    'connection pool',
    'econnrefused',
    'etimedout',
    'invocation in',
    'at object.',
    'invalid `',
    'prismaclient',
    'clientknownrequesterror',
    'clientinitializationerror',
    'sqlstate',
    'd:\\',
    'c:\\',
    'node_modules',
    '.ts:',
    '.js:',
    'select ',
    'insert into',
    'update ',
    'delete from',
  ];

  const uploadKeywords = ['upload', 'multipart', 'storage', 's3', 'supabase storage'];

  if (techKeywords.some((keyword) => lower.includes(keyword))) {
    return 'Something went wrong. Please try again in a few moments.';
  }

  if (uploadKeywords.some((keyword) => lower.includes(keyword)) && status === 400) {
    return 'Unable to upload the file. Please try again.';
  }

  if (status === 401 && (lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('token'))) {
    return 'Unable to sign you in. Please check your details and try again.';
  }

  if (status === 403 && (lower.includes('forbidden') || lower.includes('permission'))) {
    return "You don't have permission to perform this action.";
  }

  if (status === 404 && (lower.includes('not found') || lower.includes('cannot find'))) {
    return 'The requested information could not be found.';
  }

  return str;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly requestContextService: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const context = this.requestContextService.get();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let errors: Array<{ field?: string; message: string }> = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exceptionResponse: any = exception.getResponse();
      code =
        exception.name
          .replace('Exception', '')
          .replace(/([A-Z])/g, '_$1')
          .toUpperCase()
          .replace(/^_/, '') || 'BAD_REQUEST';

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = exceptionResponse.message || exception.message;
        const rawCode = exceptionResponse.error || code;
        code = String(rawCode).replace(/\s+/g, '_').toUpperCase();

        // Check if custom structured validation errors array is present
        if (Array.isArray(exceptionResponse)) {
          code = 'VALIDATION_ERROR';
          message = 'Validation failed';
          errors = exceptionResponse;
        } else if (Array.isArray(exceptionResponse.message)) {
          code = 'VALIDATION_ERROR';
          message = 'Validation failed';
          errors = exceptionResponse.message.map((msg: unknown) => {
            const err = msg as Record<string, unknown> | null;
            if (err && typeof err === 'object') {
              return {
                field: typeof err.field === 'string' ? err.field : 'field',
                message:
                  typeof err.message === 'string'
                    ? err.message
                    : JSON.stringify(err),
              };
            }

            const msgStr = typeof msg === 'string' ? msg : String(msg);
            const field = msgStr.split(' ')[0] || 'field';
            return { field, message: msgStr };
          });
        }
      } else {
        message = exceptionResponse || exception.message;
      }
    } else {
      // Translate Prisma / SQL database constraint errors into clean HTTP responses
      const err = exception as {
        code?: string;
        meta?: Record<string, unknown>;
        message?: string;
      };
      if (
        err?.code &&
        typeof err.code === 'string' &&
        err.code.startsWith('P')
      ) {
        if (err.code === 'P2002') {
          status = HttpStatus.CONFLICT;
          code = 'UNIQUE_CONSTRAINT_VIOLATION';
          const fields = Array.isArray(err.meta?.target)
            ? err.meta.target.join(', ')
            : 'field';
          message = `A record with this ${fields} already exists.`;
        } else if (err.code === 'P2003') {
          status = HttpStatus.CONFLICT;
          code = 'FOREIGN_KEY_CONSTRAINT_VIOLATION';
          message =
            'Cannot perform this action: this record is referenced by other active items.';
        } else {
          status = HttpStatus.BAD_REQUEST;
          code = 'DB_ERROR';
          message = 'Database operation failed';
        }
      } else if (err?.message) {
        message = err.message;
      } else if (exception instanceof Error) {
        message = exception.message;
      }
    }

    // Sanitize any technical Prisma/DB stack traces before sending response
    message = sanitizeErrorMessage(message, status);

    // Skip noisy 404 logs for root and browser auto-requests
    const isSilent404 =
      status === HttpStatus.NOT_FOUND &&
      SILENT_NOT_FOUND_PATHS.has(request?.path || '');

    if (isSilent404) {
      this.logger.debug(`[Skipped] ${status} - ${request?.path || 'unknown'}`);
    } else {
      // Log the detailed exception trace using Pino logger
      this.logger.error(
        `[Exception] ${status} - ${code} - ${message} - Path: ${request?.method} ${request?.originalUrl || request?.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || 'system',
      code,
      message,
      errors,
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  }
}
