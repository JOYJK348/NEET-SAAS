import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import {
  AuthSessionResponseDto,
  AuthSuccessResponseDto,
  ErrorResponseDto,
  LoginSuccessResponseDto,
  LoginTenantSelectionResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { ForcePasswordChangeGuard } from './guards/force-password-change.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import type { AuthenticatedRequestUser } from './auth.types';

type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user credentials',
    description:
      'Validates email and password, creates a session, and returns an access token. ' +
      'On success, sets a refresh token as an HttpOnly Secure cookie and returns the access token in JSON body. ' +
      'If the user has multiple tenant roles without specifying a tenantId, returns a list of tenants to select from.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      platformAdmin: {
        summary: 'Platform Admin Login',
        value: {
          email: 'admin@neetplatform.com',
          password: 'Admin@123',
          rememberMe: false,
        },
      },
      tenantAdmin: {
        summary: 'Tenant Admin Login',
        value: {
          email: 'tenant@demo.com',
          password: 'Admin@123',
          tenantId: 'tenant-id-uuid',
          rememberMe: false,
        },
      },
      multiTenant: {
        summary: 'Multi-tenant login (tenant list required)',
        value: {
          email: 'multi@tenant.com',
          password: 'Password@123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful — access token returned in body, refresh token set as HttpOnly cookie',
    type: LoginSuccessResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant selection required — user has multiple tenants',
    type: LoginTenantSelectionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (invalid email format, missing fields)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Account is not active',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'Account is temporarily locked due to too many failed attempts',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — rate limit exceeded',
  })
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(
      dto,
      {
        ipAddress: this.getIpAddress(request),
        rawUserAgent: request.headers['user-agent'] || 'unknown',
      },
      response,
    );
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token using HttpOnly refresh cookie',
    description:
      'Accepts the refresh token from the HttpOnly Secure cookie set during login. ' +
      'Validates, rotates (token rotation), and returns a new access token in JSON body. ' +
      'A new refresh token is set as an HttpOnly Secure cookie. ' +
      'The refresh token is NEVER returned in JSON — only via cookie.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Tokens refreshed — new access token in body, new refresh cookie set',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is missing, invalid, revoked, or expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Account is not active or tenant context required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — rate limit exceeded',
  })
  refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(this.getRefreshCookie(request), response);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard)
  @Post('logout')
  @ApiOperation({
    summary: 'Logout current device session',
    description:
      'Revokes the current session and clears the refresh cookie. ' +
      'Subsequent refresh attempts with the revoked token will be rejected.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked and cookie cleared',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — rate limit exceeded',
  })
  logout(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(currentUser, response);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard)
  @Post('logout-all')
  @ApiOperation({
    summary: 'Logout all active sessions',
    description:
      'Revokes every session belonging to the authenticated user ' +
      'and clears the refresh cookie on the current device.',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked and cookie cleared',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — rate limit exceeded',
  })
  logoutAll(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logoutAll(currentUser, response);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard)
  @Get('sessions')
  @ApiOperation({
    summary: 'List all active sessions for the authenticated user',
    description:
      'Returns an array of active sessions with device info, IP, expiry, ' +
      'and flags which session is the current one.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: [AuthSessionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — rate limit exceeded',
  })
  sessions(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.authService.sessions(currentUser);
  }

  private getIpAddress(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0] || 'unknown';
    }

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private getRefreshCookie(request: RequestWithCookies): string | undefined {
    const cookies: Record<string, string | undefined> = request.cookies ?? {};

    return cookies[this.authService.getRefreshCookieName()];
  }
}
