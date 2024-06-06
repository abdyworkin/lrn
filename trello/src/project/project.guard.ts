import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ProjectService } from "./project.service";

export enum ProjectRoles {
    Creator = 'creator',
    Moderator = 'moderator',
    User = 'user',
}

//TODO: похоже на костыль, исправить
const hasAccess = (userRole: ProjectRoles, projectRole: ProjectRoles) => {
    if(projectRole === ProjectRoles.User) { // Подразумевается, что userRole минимум User, в ином случае вызова функции не будет
        return true
    }

    if(projectRole === ProjectRoles.Moderator) {
        if(userRole === ProjectRoles.Creator || userRole === ProjectRoles.Moderator) return true
        return false
    }

    if(projectRole === ProjectRoles.Creator) {
        if(userRole === ProjectRoles.Creator) return true
        return false
    }

    const _: never = projectRole
}

export const Roles = Reflector.createDecorator<ProjectRoles>()

@Injectable()
export class ProjectAccessGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly projectService: ProjectService
    ) {}
    
    async canActivate(context: ExecutionContext) {
        const projectRole = this.reflector.get(Roles, context.getHandler())

        if(!projectRole) return true


        const request = context.switchToHttp().getRequest()
        const user = request.user
        const projectId = request.params.id

        const project = await this.projectService.findProjectById(projectId)

        if(!project) throw new NotFoundException()

        const userIndex = project.users.findIndex(u => u.id === user.id)
        if(userIndex === -1) throw new ForbiddenException()
        const role = project.users[userIndex].role

        return hasAccess(role, projectRole)
    }
}


