import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './task.dto';
import { GetProjectId } from '../project/project.decorator';
import { UserId } from '../user/user.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResultResponse } from '../app.response';
import { TaskOutputData, Task } from './task.entity';
import { Role, Roles } from '../role/role.decorator';
import { GetTaskId } from './task.decorator';

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
        @GetTaskId() taskId: number
    ) {
        return TaskOutputData.get(await this.taskService.getTask(taskId))
    }

    @ApiOperation({ summary: 'Создание новой задачи' })
    @ApiResponse({ status: 200, type: TaskOutputData, description: 'Возвращает поля созданной задачи' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.User)
    @Post()
    async createTask(
        @GetProjectId() projectId: number,
        @UserId() userId: number,
        @Body() body: CreateTaskDto,
    ) {
        const result = await this.taskService
            .runInTransaction(async manager => await this.taskService.createTask(projectId, body, userId, manager))

        return TaskOutputData.get(result)
    }

    @ApiOperation({ summary: 'Обновление полей задачи' })
    @ApiResponse({ status: 200, type: TaskOutputData, description: 'Возвращает данные задачи с обновленными полями' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiParam({ name: 'taskId', required: true, description: 'ID задачи' })
    @Roles(Role.TaskCreator, Role.ProjectCreator)
    @Put('/:taskId')
    async updateTask(
        @GetProjectId() projectId: number,
        @GetTaskId() taskId: number,
        @Body() body: UpdateTaskDto,
    ){
        const result = await this.taskService.runInTransaction(async manager => await this.taskService.updateTask(taskId, body, manager))
        return TaskOutputData.get(result)
    }

    @ApiOperation({ summary: 'Удаление задачи по id' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiParam({ name: 'taskId', required: true, description: 'ID задачи' })
    @Roles(Role.ProjectCreator, Role.TaskCreator)
    @Delete('/:taskId')
    async deleteTask(
        @GetTaskId() taskId: number,
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
        @GetTaskId() taskId: number,
        @Body() body: MoveTaskDto
    ) {
        return {
            result: await this.taskService
                .runInTransaction(async manager => await this.taskService.moveTask(taskId, body, manager))
        }
    }
}
