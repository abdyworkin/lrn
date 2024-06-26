import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ListService } from './list.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateListDto, MoveListDto, UpdateListMetaDto } from './list.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { ResultResponse } from '../app.response';
import { GetProjectId } from '../project/project.decorator';
import { ListOutputData } from './list.entity';
import { RoleGuard } from '../role/role.guard';
import { Role, Roles } from '../role/role.decorator';

@ApiBearerAuth()
@ApiTags('list')
@Controller('project/:projectId/list')
@UseGuards(AuthGuard, RoleGuard)
export class ListController {
    constructor(
        private readonly listService: ListService
    ) {}

    @ApiOperation({ summary: 'Получение списка по ID' })
    @ApiResponse({ status: 200, type: ListOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.User)
    @Get('/:listId')
    async getList(
        @Param('listId', ParseIntPipe) listId: number 
    ) {
        const list = await this.listService.getListById(listId)
        return ListOutputData.get(list)
    }

    @ApiOperation({ summary: 'Создание нового списка в проекте' })
    @ApiResponse({ status: 200, type: ListOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.ProjectCreator)
    @Post()
    async createList(
        @GetProjectId() projectId: number,
        @Body() body: CreateListDto
    ) {
        const list = await this.listService.runInTransaction(async manager => await this.listService.createList(projectId, body, manager))
        return ListOutputData.get(list)
    }

    @ApiOperation({ summary: 'Обновление данных проекта' })
    @ApiResponse({ status: 200, type: ListOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.ProjectCreator)
    @Put('/:listId')
    async updateListMeta(
        @Param('listId', ParseIntPipe) listId: number,
        @Body() body: UpdateListMetaDto
    ) {
        const list = await this.listService.updateListMeta(listId, body)
        return list
    }

    @ApiOperation({ summary: 'Удаление списка по ID' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.ProjectCreator)
    @Delete('/:listId')
    async deleteList(
        @Param('listId', ParseIntPipe) listId: number
    ) {
        const result = await this.listService.deleteList(listId)
        return { result }
    }


    @ApiOperation({ summary: 'Изменение позиционирования List внтури Project' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Roles(Role.ProjectCreator)
    @Put('/:listId/move')
    async moveList(
        @Param('listId', ParseIntPipe) listId: number,
        @Body() { to }: MoveListDto
    ) {
        return {
            result: await this.listService.runInTransaction(async manager => await this.listService.moveList(listId, to, manager))
        }
    }
}
