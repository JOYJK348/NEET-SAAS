import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type {
  AccessTokenPayload,
  AuthenticatedRequestUser,
} from '../auth.types';
import { TokenService } from '../token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(tokenService: TokenService) {
    const key = tokenService.getPublicKey();
    const isAsymmetric = key.includes('BEGIN');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: isAsymmetric ? ['RS256'] : ['HS256', 'RS256'],
      secretOrKey: key,
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedRequestUser {
    return payload;
  }
}
