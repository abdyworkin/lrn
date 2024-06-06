import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const ReqUser = createParamDecorator((data, req: ExecutionContextHost) => { return req.switchToHttp().getRequest().user }) 