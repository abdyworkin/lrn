import { Body, Controller, Delete, ExecutionContext, Get, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateListDto, CreateProjectDto, DeleteListDto, MoveListDto, RenameListDto, RenameProjectDto } from './project.dto';
import { NotFoundError } from 'rxjs';
import { AuthGuard } from 'src/auth/auth.guard';
import { ReqUser } from 'src/user/user.decorator';
import { User } from 'src/user/user.repo';
import { ProjectAccessGuard, ProjectRoles, Roles } from './project.guard';
import { AnimationFrameScheduler } from 'rxjs/internal/scheduler/AnimationFrameScheduler';
import { throws } from 'assert';

@Controller('project')
export class ProjectController {
    constructor(
        private readonly projectService: ProjectService,
    ) {}

    @Get('/all')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.User)
    async getAllProjects() {
        throw new InternalServerErrorException()
    }

    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.User)
    @Get('/:id')
    async getProjectById(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        return req.project
    }

    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.User)
    @Post('/new')
    async createProject(
        @Body() body: CreateProjectDto, 
        @ReqUser() user: User
    ) {
        const project = await this.projectService.createNewProject(user, body.title, body.description)
        return project
    }

    @Delete('/:id')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.Moderator)
    async deleteProject(@Param('id', ParseIntPipe) id: number) {
        throw new InternalServerErrorException()
    }

    @Post('/:id/rename')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.Moderator)
    async renameProject(@Param('id', ParseIntPipe) id: number, @Body() body: RenameProjectDto) {
        const project = await this.projectService.renameProject(id, body.title)
        return project
    }
    
    @Post('/:id/leave')
    @UseGuards(AuthGuard)
    @Roles(ProjectRoles.User)
    async leaveProject(
        @Param('id', ParseIntPipe) id: number, 
        @ReqUser() user: User
    ) {
        throw new InternalServerErrorException()
    }

    @Get('/:projectId/list/:listId')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.User)
    async getList(

    ){
        throw new InternalServerErrorException()
    }

    @Post('/:id/list/new')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.Moderator)
    async createList(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: CreateListDto
    ) {
        throw new InternalServerErrorException()
    }

    @Post('/:projectId/list/:listId/move')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.Moderator)
    async moveList(
        @Param('projectId', ParseIntPipe) projectId: number, 
        @Param('listId') listId: number, 
        @Body() body: MoveListDto
    ) {
        throw new InternalServerErrorException()
    }

    @Delete('/:projectId/list/:listId')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.Moderator)
    async deleteList(
        @Param('projectId', ParseIntPipe) projectId: number, 
        @Param('listId', ParseIntPipe) listId: number,
        @Body() body: DeleteListDto
    ) {
        throw new InternalServerErrorException()
    }

    @Post('/:projectId/list/:listId/rename')
    @UseGuards(AuthGuard, ProjectAccessGuard)
    @Roles(ProjectRoles.Moderator)
    async renameList(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('listId', ParseIntPipe) listId: number,
        @Body() body: RenameListDto
        
    ) {
        throw new InternalServerErrorException()
    }
}
