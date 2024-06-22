import { Param, ParseIntPipe, createParamDecorator } from "@nestjs/common";

export const GetProjectId = () => Param('projectId', ParseIntPipe)