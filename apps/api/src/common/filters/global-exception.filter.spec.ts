/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalExceptionFilter } from './global-exception.filter';
import { RequestContextService } from '../middleware/request-context.service';
import { BadRequestException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockArgumentsHost = {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: RequestContextService,
          useValue: {
            get: () => ({ requestId: 'test-req-123' }),
          },
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
  });

  it('should format HttpException payload correctly', () => {
    const exception = new BadRequestException('Test Exception');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        requestId: 'test-req-123',
        code: 'BAD_REQUEST',
        message: 'Test Exception',
      }),
    );
  });
});
