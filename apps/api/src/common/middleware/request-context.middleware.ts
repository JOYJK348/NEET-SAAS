import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext } from './request-context.model';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const correlationId =
      (req.headers['x-correlation-id'] as string) || requestId;
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const branchId = req.headers['x-branch-id'] as string | undefined;
    const academicYearId = req.headers['x-academic-year-id'] as
      string | undefined;
    const timezone = req.headers['x-timezone'] as string | undefined;
    const locale = req.headers['x-locale'] as string | undefined;

    // Set standard response header for tracing
    res.setHeader('x-request-id', requestId);

    const context = new RequestContext({
      requestId,
      correlationId,
      tenantId,
      branchId,
      academicYearId,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'],
      timezone,
      locale,
    });

    this.requestContextService.run(context, () => {
      next();
    });
  }
}
