export class RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly tenantId?: string;
  readonly branchId?: string;
  readonly academicYearId?: string;
  readonly userId?: string;
  readonly roles?: string[];
  readonly permissions?: string[];
  readonly ip: string;
  readonly userAgent?: string;
  readonly timezone?: string;
  readonly locale?: string;

  constructor(partial: Partial<RequestContext>) {
    Object.assign(this, partial);
  }
}
