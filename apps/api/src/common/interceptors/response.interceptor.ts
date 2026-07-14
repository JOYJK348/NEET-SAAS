import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BYPASS_RESPONSE_WRAPPER_KEY } from '../decorators/bypass-response-wrapper.decorator';
import { Response } from 'express';

export interface ResponseWrapper<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseWrapper<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseWrapper<T> | T> {
    /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
    // Bypass if not HTTP context
    if (context.getType() !== 'http') {
      return next.handle();
    }

    // Bypass if explicitly decorated with @BypassResponseWrapper()
    const isBypassed = this.reflector.getAllAndOverride<boolean>(
      BYPASS_RESPONSE_WRAPPER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isBypassed) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // Bypass if response is a StreamableFile or standard Stream/Buffer
        if (data instanceof StreamableFile || data instanceof Buffer) {
          return data;
        }

        // Bypass if response headers indicate file download / non-JSON content types
        const contentType = response.getHeader('Content-Type') as
          string | undefined;
        if (contentType && !contentType.includes('application/json')) {
          return data;
        }

        const contentDisposition = response.getHeader('Content-Disposition') as
          string | undefined;
        if (contentDisposition && contentDisposition.includes('attachment')) {
          return data;
        }

        return {
          success: true,
          timestamp: new Date().toISOString(),
          data: data ?? null,
        };
      }),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
  }
}
