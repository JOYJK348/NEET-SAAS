import { Module } from '@nestjs/common';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';

@Module({
  providers: [TenantScopedPrisma],
  exports: [TenantScopedPrisma],
})
export class PeopleModule {}
