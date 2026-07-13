import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: 'NEET SaaS Platform API',
  description: 'Enterprise Multi-Tenant Academics, Billing, live classes, exams and AI assistance endpoints.',
  version: '1.0.0',
  path: 'api/docs',
}));
