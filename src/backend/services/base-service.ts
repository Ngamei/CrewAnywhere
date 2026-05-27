import { UnauthorizedError } from '@/shared/api/errors';
import type { PlatformIdentity, PlatformSession } from '@/shared/auth/types';
import type { AuthenticatedServiceContext, ServiceContext } from './service-context';

export abstract class BaseService {
  protected constructor(protected readonly context: ServiceContext) {}

  protected requireAuthenticatedUser() {
    if (!this.context.user) {
      throw new UnauthorizedError();
    }

    return this.context.user;
  }

  protected requirePlatformSession(): PlatformSession {
    if (!this.context.session) {
      throw new UnauthorizedError();
    }

    return this.context.session;
  }

  protected requirePlatformIdentity(): PlatformIdentity {
    return this.requirePlatformSession().identity;
  }
}

export abstract class AuthenticatedBaseService extends BaseService {
  protected constructor(protected readonly context: AuthenticatedServiceContext) {
    super(context);
  }
}
