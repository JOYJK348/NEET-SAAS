import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { ForcePasswordChangeGuard } from './guards/force-password-change.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';

function decodeBase64Pem(value: string | undefined): string {
  return value ? Buffer.from(value, 'base64').toString('utf8') : '';
}

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: decodeBase64Pem(
          configService.get<string>('jwt.privateKey'),
        ),
        publicKey: decodeBase64Pem(configService.get<string>('jwt.publicKey')),
        signOptions: {
          algorithm: 'RS256',
          expiresIn:
            configService.get<number>('jwt.accessTokenExpiresInSeconds') || 900,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    TokenService,
    JwtStrategy,
    TenantGuard,
    ForcePasswordChangeGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    SessionService,
    TokenService,
    TenantGuard,
    ForcePasswordChangeGuard,
    RolesGuard,
    PermissionsGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
