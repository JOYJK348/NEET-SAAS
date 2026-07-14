import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {},
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {},
        },
        {
          provide: DiskHealthIndicator,
          useValue: {},
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {},
        },
        {
          provide: RedisHealthIndicator,
          useValue: {},
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  describe('checkLiveness', () => {
    it('should return status "ok"', () => {
      expect(healthController.checkLiveness()).toEqual({ status: 'ok' });
    });
  });
});
