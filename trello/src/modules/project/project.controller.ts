import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "src/modules/auth/auth.guard";
import { ProjectService } from "./project.service";
import { GetUser, UserId } from "src/modules/user/user.decorator";
import { ProjectAccessGuard, ProjectCreatorGuard } from "./project.guard";
import { CreateProjectDto, UpdateProjectMetaDto } from "./project.dto";
import { Project, getProjectOutput } from "src/entities/project";
import { GetProject } from "./project.decorator";
import { User } from "src/entities/user";

@Controller('project')
export class ProjectController {
    constructor(
        private readonly projectService: ProjectService
    ) {}

    @Get('/all')
    @UseGuards(AuthGuard)
    async getUserAllProjects(@UserId() userId: number) {
        try {
            const projects = await this.projectService.getAllUserProjects(userId)
            return projects
        } catch(e) {
            return e
        }
    }

    @Get('/:id')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    async getProject(
        @Param('id', ParseIntPipe) id: number,
    ) {
        const project = await this.projectService.getProject(id)
        if(!project) throw new NotFoundException('project/not-found')
        return project
    }

    @Post('/create')
    @UseGuards(AuthGuard)
    async createProject(
        @UserId() userId: number,
        @Body() body: CreateProjectDto
    ) {
        const newProject = await this.projectService.createProject(userId, body.title, body.description)
        return newProject
    }

    @Put(':id')
    @UseGuards(AuthGuard, ProjectAccessGuard, ProjectCreatorGuard)
    async updateProjectMeta(
        @Param('id', ParseIntPipe) id: number,
        @GetProject() project: Project,
        @Body() body: UpdateProjectMetaDto
    ) {
        const affected = await this.projectService.updateProjectMeta(project, body.title, body.description)
        return affected
    }

    @Delete(':id')
    @UseGuards(AuthGuard, ProjectAccessGuard, ProjectCreatorGuard)
    async deleteProject(
        @Param('id', ParseIntPipe) id: number,
        @GetProject() project: Project
    ) {
        return {
            result: await this.projectService.deleteProject(project)
        }
    }

    @Get('/:id/create/invite')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    async createInviteLink(
        @Param(":id", ParseIntPipe) id: number,
        @GetProject() project: Project
    ) {
        const { inviteCode, inviteExpires } = await this.projectService.createInviteCode(project)
        return { inviteCode, inviteExpires }
    }

    @Get('/:id/join/:code')
    @UseGuards(AuthGuard)
    async joinProject(
        @Param('id', ParseIntPipe) id: number,
        @Param('code') code: string,
        @GetUser() user: User
    ){
        const project = await this.projectService.joinByCode(code, id,  user)
        return getProjectOutput(project)
    }

}
