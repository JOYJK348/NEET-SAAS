import type { Request } from 'express';
import type { AuthenticatedRequestUser } from '../auth.types';

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedRequestUser;
};

export const PLATFORM_ROLE_CODES = new Set([
  'PLATFORM_ADMIN',
  'PLATFORM_OWNER',
]);
