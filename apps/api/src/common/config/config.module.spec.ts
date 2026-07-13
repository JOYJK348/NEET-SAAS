import { validate } from '../../config/env.validation';

describe('EnvValidation', () => {
  it('should successfully parse valid environment configurations', () => {
    const validConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/neet',
      REDIS_HOST: '127.0.0.1',
      PORT: '3500',
    };

    const parsed = validate(validConfig);
    expect(parsed.PORT).toBe(3500);
    expect(parsed.DATABASE_URL).toBe('postgresql://localhost:5432/neet');
  });

  it('should throw validation error on missing database url', () => {
    const invalidConfig = {
      PORT: '3500',
    };

    expect(() => validate(invalidConfig)).toThrow('Environment validation failed');
  });
});
