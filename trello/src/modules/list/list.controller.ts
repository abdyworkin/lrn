import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ListService } from './list.service';
import { AuthGuard } from '../auth/auth.guard';
import { ProjectAccessGuard, ProjectCreatorGuard } from '../project/project.guard';
import { CreateListDto, MoveListDto, UpdateListMetaDto } from './list.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { ResultResponse } from '../app.response';
import { GetProject } from '../project/project.decorator';
import { Project } from '../project/project.entity';
import { ListOutputData, getListOutput } from './list.entity';


//TODO: передеать под ProjectAccessGuard
@ApiBearerAuth()
@ApiTags('list')
@Controller('project/:projectId/list')
@UseGuards(AuthGuard, ProjectAccessGuard)
export class ListController {
    constructor(
        private readonly listService: ListService
    ) {}

    @ApiOperation({ summary: 'Получение списка по ID' })
    @ApiResponse({ status: 200, type: ListOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Get('/:listId')
    async getList(
        @Param('listId', ParseIntPipe) listId: number 
    ) {
        const list = await this.listService.getListById(listId)
        return getListOutput(list)
    }

    @ApiOperation({ summary: 'Создание нового списка в проекте' })
    @ApiResponse({ status: 200, type: ListOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Post()
    @UseGuards(ProjectCreatorGuard)
    async createList(
        @GetProject() project: Project,
        @Body() { title, description }: CreateListDto
    ) {
        const list = await this.listService.createList({
            title,
            description,
            projectId: project.id
        })
        return getListOutput(list)
    }

    @ApiOperation({ summary: 'Обновление данных проекта' })
    @ApiResponse({ status: 200, type: ListOutputData })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Put('/:listId')
    @UseGuards(ProjectCreatorGuard)
    async updateListMeta(
        @Param('listId', ParseIntPipe) listId: number,
        @Body() { title, description }: UpdateListMetaDto
    ) {
        const list = await this.listService.updateListMeta({
            listId, 
            title, 
            description
        })
        return list
    }

    @ApiOperation({ summary: 'Удаление списка по ID' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Delete('/:listId')
    @UseGuards(ProjectCreatorGuard)
    async deleteList(
        @Param('listId', ParseIntPipe) listId: number
    ) {
        const result = await this.listService.deleteList({ listId })

        return { result }
    }


    @ApiOperation({ summary: 'Изменение позиционирования List внтури Project' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @Put('/:listId/move')
    @UseGuards(ProjectCreatorGuard)
    async moveList(
        @Param('listId', ParseIntPipe) listId: number,
        @Body() { to }: MoveListDto
    ) {
        return {
            result: await this.listService.moveList({
                listId, 
                to
            })
        }
    }
}
