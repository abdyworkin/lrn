import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/modules/auth/auth.guard";
import { ProjectService } from "./project.service";
import { UserId } from "src/modules/user/user.decorator";
import { GetProjectId } from "./project.decorator";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ResultResponse } from "../app.response";
import { ProjectOutputData } from "./project.entity";
import { RoleGuard } from "../role/role.guard";
import { Role, Roles } from "../role/role.decorator";
import { CreateProjectDto, UpdateProjectDto, KickUserFromProjectDto } from "./project.dto";

@ApiBearerAuth()
@ApiTags('project')
@Controller('project')
@UseGuards(AuthGuard, RoleGuard)
export class ProjectController {
    constructor(
        private readonly projectService: ProjectService
    ) {}

    @ApiOperation({ summary: 'Получение всех проектов пользователя' })
    @ApiResponse({ status: 200, type: [ProjectOutputData] })
    @Get('/all')
    async getUserAllProjects(@UserId() userId: number) {
        return (await this.projectService.getAllUserProjects(userId)).map(ProjectOutputData.get)
    }

    @ApiOperation({ summary: 'Получение проекта по id' })
    @ApiResponse({ status: 200, type: ProjectOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.User)
    @Get('/:projectId')
    async getProject(
        @GetProjectId() projectId: number
    ) {
        return ProjectOutputData.get(await this.projectService.getProject(projectId))
    }

    @ApiOperation({ summary: 'Создание нового проекта' })
    @ApiResponse({ status: 200, type: ProjectOutputData, description: 'Возвращает поля созданного проекта' })
    @Post()
    async createProject(
        @UserId() userId: number,
        @Body() body: CreateProjectDto
    ) {
        
        const newProject = await this.projectService
            .runInTransaction(manager => this.projectService.createProject(body, userId, manager))
        return ProjectOutputData.get(newProject)
    }

    @ApiOperation({ summary: 'Обновление метаданных проекта' })
    @ApiResponse({ status: 200, type: ProjectOutputData, description: 'Возвращает проект с обвноленными полями' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Put(':projectId')
    @Roles(Role.ProjectCreator)
    async updateProject(
        @GetProjectId() projectId: number,
        @Body() body: UpdateProjectDto
    ) {
        
        const project = await this.projectService
            .runInTransaction(manager => this.projectService.updateProject(projectId, body, manager))
        return ProjectOutputData.get(project)
    }


    @ApiOperation({ summary: "Удаление проекта по id" })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Delete(':projectId')
    @Roles(Role.ProjectCreator)
    async deleteProject(
        @GetProjectId() projectId: number
    ) {
        return {
            result: await this.projectService.deleteProject(projectId)
        }
    }

    @ApiOperation({ summary: "Создает новый код приглашения в проект" })
    @ApiResponse({ status: 200, description: 'Возращает новый код приглашения и время его истечения'})
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:projectId/create/invite')
    @Roles(Role.ProjectCreator)
    async createInviteLink(
        @GetProjectId() projectId: number
    ) {
        return await this.projectService.createInviteCode(projectId)
    }

    //TODO: без получения доступа
    @ApiOperation({  summary: 'Эндпоинт для вступления в проект', description: 'Ожидает код приглашения в проект' })
    @ApiResponse({ status: 200, type: ProjectOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:projectId/join/:code')
    async joinProject(
        @Param('projectId', ParseIntPipe) id: number,
        @Param('code') code: string,
        @UserId() userId: number
    ){
        const project = await this.projectService.joinByCode(code, id,  userId)
        return ProjectOutputData.get(project)
    }


    @ApiOperation({ summary: 'Исключение пользователя из проекта по id' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Delete('/:projectId/user/:userId')
    @Roles(Role.ProjectCreator)
    async kickUser(
        @Param('userId', ParseIntPipe) userId: number,
        @GetProjectId() projectId: number,
        @Body() body: KickUserFromProjectDto,
    ) {
        return {
            result: await this.projectService.kickUser(userId, projectId, body.ban)
        }
    }

    @ApiOperation({ summary: 'Эндпоинт для выхода из проекта по id' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:projectId/leave')
    @Roles(Role.User)
    async leave(
        @GetProjectId() projectId: number,
        @UserId() userId: number
    ) {
        return {
            result: await this.projectService.leaveProject(userId, projectId)
        }
    }
}
