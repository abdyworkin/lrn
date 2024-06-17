import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ProjectRoles } from "../../entities/user_to_project.entity";

@Injectable()
export class ProjectAccessGuard implements CanActivate {
    async canActivate(context: ExecutionContext){
        const req = context.switchToHttp().getRequest()

        const project = req.project

        const projectUserIndex = project.users.findIndex(user => user.userId === req.user.id)

        if(projectUserIndex === -1) throw new ForbiddenException('project/forbidden')

        if(project.users[projectUserIndex].role === ProjectRoles.Banned) throw new ForbiddenException('project/banned')

        req.project = project
        req.userRole = project.users[projectUserIndex].role

        return true
    }
}

@Injectable()
export class ProjectCreatorGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest()

        if(req.userRole !== ProjectRoles.Creator) throw new ForbiddenException('project/creator-only')

        return true
    }

}