import { SetMetadata, createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const GetProject = createParamDecorator((data, req: ExecutionContextHost) => { return req.switchToHttp().getRequest().project }) 