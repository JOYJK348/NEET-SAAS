import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  describe('healthCheck', () => {
    it('should return status "ok"', () => {
      expect(healthController.getHealth()).toEqual({ status: 'ok' });
    });
  });
});
