import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, Role } from "./role.decorator";
import { ProjectService } from "../project/project.service";
import { TaskService } from "../task/task.service";
import { ProjectRoles } from "../project/user_to_project.entity";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        @Inject()
        private readonly projectSerice: ProjectService,
        @Inject()
        private readonly taskService: TaskService,
        @Inject()
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext) {
        const roles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler())
        if(!roles) return true
        
        const req = context.switchToHttp().getRequest()
        const projectId = Number(req.params.projectId)
        const taskId = Number(req.params.taskId)
        const userId = req.user.id as number

        const userRoles: Role[] = []

        if(!isNaN(projectId)) {
            const projectRole = await this.projectSerice.getUserRole(projectId, userId)

            if(projectRole === ProjectRoles.Banned) throw new ForbiddenException(`User id(${userId}) in project id(${projectId})`)

            if(projectRole) userRoles.push(Role.User)
            if(projectRole && projectRole === ProjectRoles.Creator) userRoles.push(Role.ProjectCreator)
        }

        if(!isNaN(taskId)) {
            const isTaskAuthor = await this.taskService.isTaskAuthor(taskId, userId)
            if(isTaskAuthor) userRoles.push(Role.TaskCreator)
        }

        for(let userRole of userRoles) {
            if(roles.includes(userRole)) return true
        }

        return false
    }
    
}