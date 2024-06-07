import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const UserId = createParamDecorator((data, req: ExecutionContextHost) => req.switchToHttp().getRequest().user.id) 
export const GetUser = createParamDecorator((data, req: ExecutionContextHost) => req.switchToHttp().getRequest().user)