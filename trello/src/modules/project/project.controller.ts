import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "src/modules/auth/auth.guard";
import { ProjectService } from "./project.service";
import { GetUser, UserId } from "src/modules/user/user.decorator";
import { ProjectAccessGuard, ProjectCreatorGuard } from "./project.guard";
import { AddFieldDto, CreateProjectDto, KickUserFromProjectDto, UpdateProjectMetaDto } from "./project.dto";
import { GetProject } from "./project.decorator";
import { User } from "src/modules/user/user.entity";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ResultResponse } from "../app.response";
import { ProjectOutputData, Project } from "./project.entity";
import { ProjectTaskFieldOutputData } from "src/entities/project_field.entity";

@ApiBearerAuth()
@ApiTags('project')
@Controller('project')
@UseGuards(AuthGuard)
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
    @Get('/:projectId')
    @UseGuards(ProjectAccessGuard)
    async getProject(
        @GetProject() project: Project
    ) {
        return ProjectOutputData.get(project)
    }

    //TODO: add single/multiple fields
    @ApiOperation({ summary: 'Создание нового проекта' })
    @ApiResponse({ status: 200, type: ProjectOutputData, description: 'Возвращает поля созданного проекта' })
    @Post('/create')
    async createProject(
        @GetUser() user: User,
        @Body() { title, description, fields }: CreateProjectDto
    ) {
        const newProject = await this.projectService.createProject({ user, title, description, fields })
        return ProjectOutputData.get(newProject)
    }

    //TODO: может обновить любые данные, исправить
    @ApiOperation({ summary: 'Обновление метаданных проекта' })
    @ApiResponse({ status: 200, type: ProjectOutputData, description: 'Возвращает проект с обвноленными полями' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Put(':projectId')
    @UseGuards(ProjectAccessGuard, ProjectCreatorGuard)
    async updateProjectMeta(
        @GetProject() project: Project,
        @Body() body: UpdateProjectMetaDto
    ) {
        const affected = await this.projectService.updateProjectMeta({
            project, 
            title: body.title, 
            description: body.description,
            fields: body.fields
        })
        return affected
    }


    @ApiOperation({ summary: "Удаление проекта по id" })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Delete(':projectId')
    @UseGuards(ProjectAccessGuard, ProjectCreatorGuard)
    async deleteProject(
        @GetProject() project: Project
    ) {
        return {
            result: await this.projectService.deleteProject(project)
        }
    }

    //TODO: задокументировать response как полагается
    @ApiOperation({ summary: "Создает новый код приглашения в проект" })
    @ApiResponse({ status: 200,  description: 'Возращает новый код приглашения и время его истечения'})
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:projectId/create/invite')
    @UseGuards(ProjectAccessGuard)
    async createInviteLink(
        @GetProject() project: Project
    ) {
        const { inviteCode, inviteExpires } = await this.projectService.createInviteCode(project)
        return { inviteCode, inviteExpires }
    }

    //TODO: без получения доступа
    @ApiOperation({  summary: 'Эндпоинт для вступления в проект', description: 'Ожидает код приглашения в проект' })
    @ApiResponse({ status: 200, type: ProjectOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:projectId/join/:code')
    async joinProject(
        @Param('projectId', ParseIntPipe) id: number,
        @Param('code') code: string,
        @GetUser() user: User
    ){
        const project = await this.projectService.joinByCode(code, id,  user)
        return ProjectOutputData.get(project)
    }


    //TODO: поменять все методы на get или post
    @ApiOperation({ summary: 'Исключение пользователя из проекта по id' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Delete('/:projectId/user/:userId')
    @UseGuards(ProjectAccessGuard, ProjectCreatorGuard)
    async kickUser(
        @Param('userId', ParseIntPipe) userId: number,
        @GetProject() project: Project,
        @Body() body: KickUserFromProjectDto,
    ) {
        return {
            result: await this.projectService.kickUser(userId, project, body.ban)
        }
    }

    @ApiOperation({ summary: 'Эндпоинт для выхода из проекта по id' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:projectId/leave')
    @UseGuards(ProjectAccessGuard)
    async leave(
        @GetProject() project: Project,
        @GetUser() user: User
    ) {
        return {
            result: await this.projectService.leaveProject(user, project)
        }
    }

    //Add multiple fields
    @ApiOperation({ summary: 'Добавление поля для существующего проекта' })
    @ApiResponse({ status: 200, type: ProjectTaskFieldOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Post('/:projectId/addfield')
    @UseGuards(ProjectAccessGuard)
    async addField(
        @GetProject() project: Project,
        @Body() body: AddFieldDto
    ) {
        return ProjectTaskFieldOutputData
            .get(await this.projectService.addField(project.id, {
                type: body.type,
                title: body.title,
                options: body.options
            }))
    }
    
}
