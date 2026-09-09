import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PasswordService } from '../auth/password.service';

import { PlatformDashboardController } from './platform-dashboard.controller';
import { PlatformDashboardService } from './platform-dashboard.service';

import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformTenantsService } from './platform-tenants.service';

import { PlatformTenantAdminsController } from './platform-tenant-admins.controller';
import { PlatformTenantAdminsService } from './platform-tenant-admins.service';

import { PlatformRbacController } from './platform-rbac.controller';
import { PlatformRbacService } from './platform-rbac.service';

import { PlatformFeaturesController } from './platform-features.controller';
import { PlatformFeaturesService } from './platform-features.service';

import { PlatformAuditController } from './platform-audit.controller';
import { PlatformAuditService } from './platform-audit.service';

@Module({
  imports: [PrismaModule, AuthModule, MailModule],
  controllers: [
    PlatformDashboardController,
    PlatformTenantsController,
    PlatformTenantAdminsController,
    PlatformRbacController,
    PlatformFeaturesController,
    PlatformAuditController,
  ],
  providers: [
    PasswordService,
    PlatformDashboardService,
    PlatformTenantsService,
    PlatformTenantAdminsService,
    PlatformRbacService,
    PlatformFeaturesService,
    PlatformAuditService,
  ],
  exports: [
    PlatformDashboardService,
    PlatformTenantsService,
    PlatformTenantAdminsService,
    PlatformRbacService,
    PlatformFeaturesService,
    PlatformAuditService,
  ],
})
export class PlatformModule {}
