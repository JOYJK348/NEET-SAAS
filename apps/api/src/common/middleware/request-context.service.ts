import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from './request-context.model';

@Injectable()
export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  /**
   * Runs a function with the specified request context.
   */
  run(context: RequestContext, fn: () => void): void {
    RequestContextService.storage.run(context, fn);
  }

  /**
   * Retrieves the current request context.
   */
  get(): RequestContext | undefined {
    return RequestContextService.storage.getStore();
  }

  /**
   * Helper to retrieve context attributes safely.
   */
  get tenantId(): string | undefined {
    return this.get()?.tenantId;
  }

  get userId(): string | undefined {
    return this.get()?.userId;
  }

  get requestId(): string | undefined {
    return this.get()?.requestId;
  }

  get correlationId(): string | undefined {
    return this.get()?.correlationId;
  }
}
