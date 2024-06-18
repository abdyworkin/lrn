import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, Role } from "./role.decorator";
import { Project } from "../project/project.entity";
import { Task } from "../task/task.entity";
import { ProjectRoles } from "src/entities/user_to_project.entity";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        @Inject()
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext) {
        const roles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler())
        if(!roles) return true
        
        const req = context.switchToHttp().getRequest()
        const userId = req.user.id as number
        const project = req.project as Project
        const task = req.task as Task

        const userRoles: Role[] = []

        if(project) {
            const userInProject = project.users.find(e => e.userId === userId)

            if(!userInProject) return false

            userRoles.push(Role.User)
            if(userInProject.role === ProjectRoles.Creator) userRoles.push(Role.ProjectCreator)
        }

        if(task && task.author.id === userId) userRoles.push(Role.TaskCreator)

        for(let userRole of userRoles) {
            if(roles.includes(userRole)) return true
        }

        return false
    }
    
}