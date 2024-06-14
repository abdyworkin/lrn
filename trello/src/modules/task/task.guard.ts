import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Inject, NotFoundException } from "@nestjs/common";
import { Project } from "../project/project.entity";
import { ProjectRoles } from "../../entities/user_to_project.entity";

export class TaskEditAccessGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest()

        if(isNaN(Number(req.params.taskId))) throw new BadRequestException("taskId must be number")

        const project = req.project as Project
        const task = project.tasks.find(e => e.id === Number(req.params.taskId))

        if(!task) throw new NotFoundException()

        const creator = project.users.find(e => e.role === ProjectRoles.Creator)

        if(req.user.id !== creator.userId && task.authorId === req.user.id) throw new ForbiddenException()

        req.task = task

        return true
    }

}