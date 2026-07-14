import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from './auth.types';

type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
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
  refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(this.getRefreshCookie(request), response);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(currentUser, response);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logoutAll(currentUser, response);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
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
