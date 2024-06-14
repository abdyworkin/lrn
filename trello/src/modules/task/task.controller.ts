import { Body, Controller, Delete, Get, InternalServerErrorException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './task.dto';
import { ProjectAccessGuard } from '../project/project.guard';
import { GetProject } from '../project/project.decorator';
import { GetUser } from '../user/user.decorator';
import { User } from 'src/modules/user/user.entity';
import { GetTask } from './task.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResultResponse } from '../app.response';
import { Project } from '../project/project.entity';
import { TaskOutputData, getTaskOutput, Task } from './task.entity';
import { TaskEditAccessGuard } from './task.guard';

@ApiBearerAuth()
@ApiTags('task')
@Controller('project/:projectId/task')
@UseGuards(AuthGuard, ProjectAccessGuard)
export class TaskController {
    constructor(
        private readonly taskService: TaskService
    ) {}

    @ApiOperation({ summary: 'Получение задачи по id' })
    @ApiResponse({ status: 200, type: TaskOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:taskId')
    async getTaskById(
        @Param('taskId', ParseIntPipe) id: number
    ) {
        return getTaskOutput(await this.getTaskById(id))
    }

    @ApiOperation({ summary: 'Создание новой задачи' })
    @ApiResponse({ status: 200, type: TaskOutputData, description: 'Возвращает поля созданной задачи' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Post()
    async createTask(
        @GetProject() project: Project,
        @GetUser() user: User,
        @Body() { title, description, listId }: CreateTaskDto,
    ) {
        return getTaskOutput(await this.taskService.createTask({ 
            title, 
            description, 
            listId, 
            projectId: project.id,
            user,
        }))
    }

    @ApiOperation({ summary: 'Обновление полей задачи' })
    @ApiResponse({ status: 200, type: TaskOutputData, description: 'Возвращает данные задачи с обновленными полями' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Put('/:taskId')
    @UseGuards(TaskEditAccessGuard)
    async updateTask(
        @Param('taskId') taskId: number,
        @Body() { title, description }: UpdateTaskDto,
    ){
        return getTaskOutput(await this.taskService.updateTask({ taskId, title, description }))
    }

    @ApiOperation({ summary: 'Удаление задачи по id' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Delete('/:taskId')
    @UseGuards(TaskEditAccessGuard)
    async deleteTask(
        @Param('taskId') taskId: number,
    ) {
        return {
            result: await this.taskService.deleteTask({ taskId })
        }
    }

    @ApiOperation({ summary: 'Изменение позиционирования задачи внтури проекта' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiParam({ name: 'taskId', required: true, description: 'ID задачи' })
    @Put('/:taskId/move')
    @UseGuards(TaskEditAccessGuard)
    async moveTask(
        @GetTask() task: Task,
        @Body() { newPosition, targetListId }: MoveTaskDto
    ) {
        return {
            result: await this.taskService.moveTask({
                newPosition,
                targetListId,
                task
            })
        }
    }
}
