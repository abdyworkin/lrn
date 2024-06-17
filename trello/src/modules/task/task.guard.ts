import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Inject, NotFoundException } from "@nestjs/common";
import { Project } from "../project/project.entity";
import { ProjectRoles } from "../../entities/user_to_project.entity";
import { Task } from "./task.entity";

export class TaskEditAccessGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest()

        const project = req.project as Project
        const task = req.task as Task

        const creator = project.users.find(e => e.role === ProjectRoles.Creator)

        if(req.user.id !== creator.userId && task.authorId === req.user.id) throw new ForbiddenException()

        return true
    }

}