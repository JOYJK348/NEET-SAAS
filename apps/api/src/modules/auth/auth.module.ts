import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

function decodeBase64Pem(value: string | undefined): string {
  return value ? Buffer.from(value, 'base64').toString('utf8') : '';
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: decodeBase64Pem(configService.get<string>('jwt.privateKey')),
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
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [AuthService, TokenService, JwtModule, PassportModule],
})
export class AuthModule {}
