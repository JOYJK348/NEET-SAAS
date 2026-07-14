import { Test, TestingModule } from '@nestjs/testing';
import { ResponseInterceptor } from './response.interceptor';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;

  const mockResponse = {
    getHeader: jest.fn(),
  };

  const mockExecutionContext = {
    getType: () => 'http',
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getResponse: () => mockResponse,
    }),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: () => of({ key: 'val' }),
  } as unknown as CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseInterceptor,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    interceptor = module.get<ResponseInterceptor<any>>(ResponseInterceptor);
  });

  it('should wrap success payloads correctly', (done) => {
    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((wrapped) => {
        expect(wrapped).toEqual(
          expect.objectContaining({
            success: true,
            data: { key: 'val' },
          }),
        );
        done();
      });
  });
});
