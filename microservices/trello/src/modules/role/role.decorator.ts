import { ExecutionContext, SetMetadata, createParamDecorator } from "@nestjs/common";

export const ROLES_KEY = 'ROLES'

export enum Role {
    ProjectCreator = 'project-creator',
    User = 'user',
    TaskCreator = 'task-creator',
}


export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

export const GetUserId = createParamDecorator((data: any, context: ExecutionContext) => context.switchToHttp().getRequest().user.id)