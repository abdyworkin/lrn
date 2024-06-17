import { BadRequestException, Inject, Injectable, NestMiddleware, NotFoundException } from "@nestjs/common";
import { ProjectService } from "./project.service";

@Injectable()
export class ProjectLoadMiddleware implements NestMiddleware {
    constructor(
        @Inject()
        private readonly projectService: ProjectService
    ) {}    

    async use(req: any, res: any, next: (error?: any) => void) {
        const projectId = Number(req.params.projectId)

        if(isNaN(projectId)) throw new BadRequestException(`ProjectId must be number: ${projectId}`)

        const project = await this.projectService.getProject(projectId)

        if(!project) throw new NotFoundException(`Project id(${projectId}) does not exist`)

        req.project = project

        next()
    }
}