import { BadRequestException, Inject, Injectable, NestMiddleware, NotFoundException } from "@nestjs/common";
import { Project } from "../project/project.entity";
import { TaskService } from "./task.service";

@Injectable()
export class TaskLoadMiddleware implements NestMiddleware {
    constructor(
        @Inject()
        private readonly taskService: TaskService
    ) {}


    async use(req: any, res: any, next: (error?: any) => void) {
        const project = req.project as Project

        const taskId = Number(req.params.taskId)

        if(isNaN(taskId)) throw new BadRequestException(`Task id must be number, got: ${typeof req.params.taskId}`)

        let task;
        //ProjectLoadMiddleware не был запущен
        if(!project) {
            task = await this.taskService.getTask(taskId)
            req.task = task
            return next()
        }

        task = project.tasks.find(e => e.id === taskId)
        if(!task) throw new NotFoundException(`Task id(${taskId}) not exists in project id(${project.id})`)

        req.task = task
        next()
    }
}