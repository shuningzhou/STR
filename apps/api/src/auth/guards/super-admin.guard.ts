import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth-user';
import { SUPER_ADMIN_EMAIL } from '../constants';

export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user?.email) throw new ForbiddenException('Unauthorized');
    if (user.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
