import { Body, Controller, Delete, Get, InternalServerErrorException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './task.dto';
import { GetProject } from '../project/project.decorator';
import { GetUser } from '../user/user.decorator';
import { User } from 'src/modules/user/user.entity';
import { GetTask } from './task.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResultResponse } from '../app.response';
import { Project } from '../project/project.entity';
import { TaskOutputData, Task } from './task.entity';
import { Role, Roles } from '../role/role.decorator';

@ApiBearerAuth()
@ApiTags('task')
@Controller('project/:projectId/task')
@UseGuards(AuthGuard)
export class TaskController {
    constructor(
        private readonly taskService: TaskService
    ) {}

    @ApiOperation({ summary: 'Получение задачи по id' })
    @ApiResponse({ status: 200, type: TaskOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiParam({ name: 'taskId', required: true, description: 'ID задачи' })
    @Roles(Role.User)
    @Get('/:taskId')
    async getTaskById(
        @GetTask() task: Task // Таск уже подгружен в мидлваре
    ) {
        return TaskOutputData.get(task)
    }

    @ApiOperation({ summary: 'Создание новой задачи' })
    @ApiResponse({ status: 200, type: TaskOutputData, description: 'Возвращает поля созданной задачи' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.User)
    @Post()
    async createTask(
        @GetProject() project: Project,
        @GetUser() user: User,
        @Body() body: CreateTaskDto,
    ) {
        const result = await this.taskService
            .runInTransaction(async manager => await this.taskService.createTask(project, body, user, manager))

        return TaskOutputData.get(result)
    }

    @ApiOperation({ summary: 'Обновление полей задачи' })
    @ApiResponse({ status: 200, type: TaskOutputData, description: 'Возвращает данные задачи с обновленными полями' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiParam({ name: 'taskId', required: true, description: 'ID задачи' })
    @Roles(Role.TaskCreator, Role.ProjectCreator)
    @Put('/:taskId')
    async updateTask(
        @GetProject() project: Project,
        @GetTask() task: Task,
        @Body() body: UpdateTaskDto,
    ){
        const result = await this.taskService.runInTransaction(async manager => await this.taskService.updateTask(task.id, body, manager))
        return TaskOutputData.get(result)
    }

    @ApiOperation({ summary: 'Удаление задачи по id' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiParam({ name: 'taskId', required: true, description: 'ID задачи' })
    @Roles(Role.ProjectCreator, Role.TaskCreator)
    @Delete('/:taskId')
    async deleteTask(
        @Param('taskId') taskId: number,
    ) {
        return {
            result: await this.taskService.runInTransaction(async manager => await this.taskService.deleteTask(taskId, manager))
        }
    }

    @ApiOperation({ summary: 'Изменение позиционирования задачи внтури проекта' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiParam({ name: 'taskId', required: true, description: 'ID задачи' })
    @Roles(Role.ProjectCreator, Role.TaskCreator)
    @Put('/:taskId/move')
    async moveTask(
        @GetTask() task: Task,
        @Body() body: MoveTaskDto
    ) {
        return {
            result: await this.taskService
                .runInTransaction(async manager => await this.taskService.moveTask(task.id, body, manager))
        }
    }
}
