/* eslint-disable @typescript-eslint/unbound-method */
import { RequestContextService } from './request-context.service';
import { RequestContextMiddleware } from './request-context.middleware';
import { Request, Response } from 'express';

describe('RequestContextMiddleware', () => {
  let service: RequestContextService;
  let middleware: RequestContextMiddleware;

  beforeEach(() => {
    service = new RequestContextService();
    middleware = new RequestContextMiddleware(service);
  });

  it('should capture and scope request context parameters correctly', (done) => {
    const mockRequest = {
      headers: {
        'x-request-id': 'test-req-123',
        'x-tenant-id': 'tenant-789',
      },
      ip: '127.0.0.1',
    } as unknown as Request;

    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const nextFunction = () => {
      const context = service.get();
      expect(context).toBeDefined();
      expect(context?.requestId).toBe('test-req-123');
      expect(context?.tenantId).toBe('tenant-789');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-request-id',
        'test-req-123',
      );
      done();
    };

    middleware.use(mockRequest, mockResponse, nextFunction);
  });
});
