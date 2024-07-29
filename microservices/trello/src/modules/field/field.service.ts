import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Project } from '../project/project.entity';
import { FieldType, ProjectTaskField, ProjectTaskFieldEnumOptions } from 'src/modules/field/project_field.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, QueryRunner, Repository } from 'typeorm';
import { AddFieldDto, EditFieldDto } from './field.dto';
import { FieldvalService } from '../fieldval/fieldval.service';

@Injectable()
export class FieldService {
    constructor(
        private readonly fieldvalService: FieldvalService,
        @InjectRepository(ProjectTaskField)
        private readonly projectTaskFieldRepository: Repository<ProjectTaskField>,
        @InjectRepository(ProjectTaskFieldEnumOptions)
        private readonly projectTaslFieldEnumOptionsRepository: Repository<ProjectTaskFieldEnumOptions>,
        private readonly dataSource: DataSource
    ) {}

    async runInTransaction(func: (manager: EntityManager) => Promise<any>) {
        return await this.dataSource.transaction(async manager => await func(manager))
    }

    async getFields(projectId: number, fieldIds: number[], manager?: EntityManager): Promise<ProjectTaskField[] | null> {
        const fieldRepo =  manager?.getRepository(ProjectTaskField) || this.projectTaskFieldRepository
        
        const found = await fieldRepo.find({
            where: {
                projectId,
                id: In(fieldIds)
            },
            relations: [ 'enumOptions' ]
        })
        
        return found
    }

    async createFields(projectId: number, fieldsData: AddFieldDto[], manager?: EntityManager): Promise<ProjectTaskField[]> {
        const fieldRepo =  manager?.getRepository(ProjectTaskField) || this.projectTaskFieldRepository

        const fields = []

        for (let fieldData of fieldsData) {
            const field = new ProjectTaskField

            field.type = fieldData.type
            field.title = fieldData.title
            field.projectId = projectId

            const savedField = await fieldRepo.save(field)

            if(fieldData.type === FieldType.Enum) {
                savedField.enumOptions = await this.createOptionEntites(savedField.id, fieldData.options, manager)
            }

            fields.push(savedField)
        }

        return fields
    }

    private async createOptionEntites(fieldId: number, options: string[], manager?: EntityManager): Promise<ProjectTaskFieldEnumOptions[]> {
        const optionsRepo = manager?.getRepository(ProjectTaskFieldEnumOptions) || this.projectTaslFieldEnumOptionsRepository

        const optionEntities = options.map(e => {
            const option = new ProjectTaskFieldEnumOptions()
            option.fieldId = fieldId
            option.option = e
            return option
        })

        return await optionsRepo.save(optionEntities)
    }

    async updateFields(projectId: number, fieldsData: EditFieldDto[], manager?: EntityManager): Promise<ProjectTaskField[]> {
        const fieldRepo = manager?.getRepository(ProjectTaskField) || this.projectTaskFieldRepository;
        const optionsRepo = manager?.getRepository(ProjectTaskFieldEnumOptions) || this.projectTaslFieldEnumOptionsRepository;
        const updatedFields = [];

        const fields = await fieldRepo.find({
            where: {
                id: In(fieldsData.map(e => e.id)),
                projectId: projectId
            },
            relations: ['enumOptions']
        });

        for (const fieldData of fieldsData) {
            const field = fields.find(f => f.id === fieldData.id) // Поля могут не бить
    
            if (field) {
                field.type = fieldData.type || field.type;

                field.title = fieldData.title || field.title;
    
                field.enumOptions = []
                await optionsRepo.delete({ fieldId: field.id });

                const result = await this.fieldvalService.deleteByField([ field.id ])
                if (!result) {
                    throw new InternalServerErrorException(`Failed to delete field id(${field.id})`)
                }

                // Если поле имеет тип Enum, сначала удаляем старые опции
                if (fieldData.type === FieldType.Enum && fieldData.options) {
                    field.enumOptions = await this.createOptionEntites(field.id, fieldData.options, manager);
                }
    
                const savedField = await fieldRepo.save(field);
                updatedFields.push(savedField);
            }
        }
    
        return updatedFields;
    }
    
    async deleteFields(projectId: number, fieldIds: number[], manager?: EntityManager): Promise<boolean> {
        const fieldRepo = manager?.getRepository(ProjectTaskField) || this.projectTaskFieldRepository;
        const optionsRepo = manager?.getRepository(ProjectTaskFieldEnumOptions) || this.projectTaslFieldEnumOptionsRepository;
    
        for (const fieldId of fieldIds) {
            await optionsRepo.delete({ fieldId });
        }
    
        const result = await fieldRepo.delete({
            id: In(fieldIds),
            projectId: projectId
        });

        return result.affected > 0
    }
}
