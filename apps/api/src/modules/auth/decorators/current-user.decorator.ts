import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedRequestUser } from '../auth.types';

type RequestWithUser = Request & {
  user?: AuthenticatedRequestUser;
};

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedRequestUser | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
