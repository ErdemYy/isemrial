import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedUserContext } from "../types";

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUserContext = request.user;
    return data ? user?.[data] : user;
  },
);
