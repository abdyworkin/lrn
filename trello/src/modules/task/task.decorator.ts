import { Param, ParseIntPipe, createParamDecorator } from "@nestjs/common";

export const GetTaskId = () => Param('taskId', ParseIntPipe)