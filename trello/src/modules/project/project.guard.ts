import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { Observable } from "rxjs";
import { Request } from "express";
import { Project } from "src/entities/project";
import { ProjectRoles } from "src/entities/user_to_project";

@Injectable()
export class ProjectAccessGuard implements CanActivate {
    constructor(
        @Inject()
        private readonly projectService: ProjectService
    ) {}

    async canActivate(context: ExecutionContext){
        const req = context.switchToHttp().getRequest()

        if(isNaN(Number(req.params.id))) throw new BadRequestException("id must be number")

        const project = await this.projectService.getProject(req.params.id)

        if(!project) throw new NotFoundException('project/not-found')

        const projectUserIndex = project.users.findIndex(user => user.id === req.user.id)

        if(projectUserIndex === -1) throw new ForbiddenException('project/forbidden')

        req.project = project
        req.projectUserIndex = projectUserIndex

        return true
    }
}

@Injectable()
export class ProjectCreatorGuard implements CanActivate {

    canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest()

        if(req.project.users[req.projectUserIndex].role !== ProjectRoles.Creator) throw new ForbiddenException('project/forbidden')

        return true

    }

}