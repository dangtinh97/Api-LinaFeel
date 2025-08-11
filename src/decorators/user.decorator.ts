import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data,ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;  // This will retrieve the user that was attached in the JWT strategy
  },
);
