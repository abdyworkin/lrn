import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { FieldService } from './field.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectTaskField, ProjectTaskFieldOutputData } from 'src/modules/field/project_field.entity';
import { Role, Roles } from '../role/role.decorator';
import { GetProject, GetProjectId } from '../project/project.decorator';
import { Project } from '../project/project.entity';
import { ErrorResponse, ResultResponse } from '../app.response';
import { AddFieldDto, EditFieldDto } from './field.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RoleGuard } from '../role/role.guard';

@ApiBearerAuth()
@ApiTags('field')
@Controller('project/:projectId/field')
@UseGuards(AuthGuard, RoleGuard)
export class FieldController {
    constructor(
        private readonly fieldService: FieldService
    ) {}

    @ApiOperation({ summary: 'Получение мета данных поля по ID' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    
    @ApiResponse({ status: 404, type: ErrorResponse })
    @Get('/:fieldId')
    @Roles(Role.User)
    async getField(
        @GetProjectId() projectId: number,
        @Param('fieldId', ParseIntPipe) fieldId: number 
    ) {
        const result = await this.fieldService.getFields(projectId, [ fieldId ])
        if(!result || result.length === 0) throw new NotFoundException(`Field id(${fieldId}) does not exist`)
        return ProjectTaskFieldOutputData.get(result[0])
    }
    
    @ApiOperation({ summary: 'Создание нового поля в проекте' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiResponse({ status: 200, type: ProjectTaskFieldOutputData })
    @ApiResponse({ status: 500, type: ErrorResponse })
    @Post()
    @Roles(Role.ProjectCreator)
    async createField(
        @GetProjectId() projectId: number,
        @Body() body: AddFieldDto
    ) {
        const result = await this.fieldService.runInTransaction(async manager => await this.fieldService.createFields(projectId, [ body ], manager))
        if(!result || result.length === 0) throw new InternalServerErrorException('could not create field')
        return ProjectTaskFieldOutputData.get(result[0])
    }

    @ApiOperation({ summary: 'Обновление данных поля в проекте' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiResponse({ status: 200, type: ProjectTaskFieldOutputData })
    @ApiResponse({ status: 500, type: ErrorResponse })
    @Put('/edit')
    @Roles(Role.ProjectCreator)
    async updateField(
        @GetProject() project: Project,
        @Param('fieldId', ParseIntPipe) fieldId: number,
        @Body() body: EditFieldDto,
    ) {
        const result = await this.fieldService.runInTransaction(async manager => await this.fieldService.updateFields(project.id, [ body ], manager))
        if(!result || result.length === 0) throw new InternalServerErrorException('could not update field')
        return ProjectTaskFieldOutputData.get(result[0])
    }

    @ApiOperation({ summary: 'Удаление поля из проекта' })
    @ApiParam({ name: 'projectId', required: true, description: 'ID проекта' })
    @ApiResponse({ status: 200, type: ResultResponse })
    @ApiResponse({ status: 500, type: ErrorResponse })
    @Delete('/:fieldId')
    @Roles(Role.ProjectCreator)
    async deleteField(
        @GetProject() project: Project,
        @Param('fieldId', ParseIntPipe) fieldId: number 
    ) {
        return {
            result: await this.fieldService.runInTransaction(async manager => await this.fieldService.deleteFields(project.id, [ fieldId ], manager))
        }
    }
}
