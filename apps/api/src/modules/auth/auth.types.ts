export interface AccessTokenPayload {
  sub: string;
  sessionId: string;
  tenantId?: string | null;
  roleCode: string;
  forcePasswordChange: boolean;
  iat?: number;
  exp?: number;
}

export type AuthenticatedRequestUser = AccessTokenPayload;

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}

export interface LoginRequestContext {
  ipAddress: string;
  rawUserAgent: string;
}

export interface LoginTenantOption {
  tenantId: string;
  roleCode: string;
}

export interface LoginTenantSelectionResponse {
  tenantSelectionRequired: true;
  tenants: LoginTenantOption[];
}

export interface LoginSuccessResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string | null;
    roleCode: string;
    forcePasswordChange: boolean;
  };
}

export type LoginResponse = LoginSuccessResponse | LoginTenantSelectionResponse;
