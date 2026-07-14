export interface AccessTokenPayload {
  sub: string;
  sessionId: string;
  tenantId?: string | null;
  roleCode: string;
  forcePasswordChange: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequestUser extends AccessTokenPayload {}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}
