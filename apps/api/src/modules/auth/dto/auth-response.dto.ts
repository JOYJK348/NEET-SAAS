import { ApiProperty } from '@nestjs/swagger';

export class LoginTenantOptionDto {
  @ApiProperty({ example: 'tenant-id-uuid' })
  tenantId: string;

  @ApiProperty({ example: 'TENANT_ADMIN' })
  roleCode: string;
}

export class LoginTenantSelectionResponseDto {
  @ApiProperty({ example: true })
  tenantSelectionRequired: true;

  @ApiProperty({ type: [LoginTenantOptionDto] })
  tenants: LoginTenantOptionDto[];
}

export class LoginUserInfoDto {
  @ApiProperty({ example: 'user-id-uuid' })
  id: string;

  @ApiProperty({ example: 'admin@neetplatform.com' })
  email: string;

  @ApiProperty({ example: 'Platform' })
  firstName: string;

  @ApiProperty({ example: 'Admin' })
  lastName: string;

  @ApiProperty({ example: 'tenant-id-uuid', nullable: true })
  tenantId: string | null;

  @ApiProperty({ example: 'PLATFORM_ADMIN' })
  roleCode: string;

  @ApiProperty({ example: false })
  forcePasswordChange: boolean;
}

export class LoginSuccessResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ type: LoginUserInfoDto })
  user: LoginUserInfoDto;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;
}

export class AuthSuccessResponseDto {
  @ApiProperty({ example: true })
  success: true;
}

export class AuthSessionResponseDto {
  @ApiProperty({ example: 'session-id-uuid' })
  sessionId: string;

  @ApiProperty({ example: 'Chrome on Windows' })
  deviceName: string;

  @ApiProperty({ example: 'Chrome' })
  browserName: string;

  @ApiProperty({ example: '192.168.1.1' })
  ipAddress: string;

  @ApiProperty({ example: '2026-07-15T10:00:00.000Z' })
  lastActiveAt: Date;

  @ApiProperty({ example: '2026-07-22T10:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: true })
  isCurrentSession: boolean;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Invalid email or password' })
  message: string;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;
}
