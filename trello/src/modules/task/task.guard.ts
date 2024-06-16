import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Inject, NotFoundException } from "@nestjs/common";
import { Project } from "../project/project.entity";
import { ProjectRoles } from "../../entities/user_to_project.entity";
import { Task } from "./task.entity";

export class TaskEditAccessGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest()

        if(isNaN(Number(req.params.taskId))) throw new BadRequestException("taskId must be number")

        const project = req.project as Project
        let task: Task | undefined
        
        for(let list of project.lists) {
            for(let t of list.tasks) {
                if(t.id === Number(req.params.taskId)) {
                    task = t
                    break
                }
            }
        }

        if(!task) throw new NotFoundException()

        const creator = project.users.find(e => e.role === ProjectRoles.Creator)

        if(req.user.id !== creator.userId && task.authorId === req.user.id) throw new ForbiddenException()

        req.task = task

        return true
    }

}