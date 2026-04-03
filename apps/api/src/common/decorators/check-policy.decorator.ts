import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DataAccessPolicy } from '../middleware/rls.middleware';

export const GetPolicy = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DataAccessPolicy => {
    const request = ctx.switchToHttp().getRequest();
    return request.dataPolicy;
  },
);

export function requirePolicy(policy: DataAccessPolicy, capability: keyof DataAccessPolicy): void {
  if (!policy[capability]) {
    throw new ForbiddenException(
      `Your account does not have permission for this action. Required: ${capability}`,
    );
  }
}
