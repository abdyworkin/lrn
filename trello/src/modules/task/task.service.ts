import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, FieldDto, MoveTaskDto, UpdateTaskDto } from './task.dto';
import { Project } from '../project/project.entity';
import { FieldType, ProjectTaskField } from 'src/modules/field/project_field.entity';
import { TaskFieldString } from 'src/entities/task_field_string.entity';
import { TaskFieldNumber } from 'src/entities/task_field_number.entity';
import { TaskFieldEnum } from 'src/entities/task_field_enum.entity';

@Injectable()
export class TaskService {  
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(TaskFieldString)
        private readonly taskFieldStringRepository: Repository<TaskFieldString>,
        @InjectRepository(TaskFieldNumber)
        private readonly taskFieldNumberRepository: Repository<TaskFieldNumber>,
        @InjectRepository(TaskFieldEnum)
        private readonly taskFieldEnumRepository: Repository<TaskFieldEnum>,
        private readonly dataSource: DataSource,
    ) {}

    async runInTransaction(func: (manager: EntityManager) => Promise<any>) {
        return await this.dataSource.transaction(async manager => await func(manager))
    }

    async isTaskAuthor(taskId: number, userId: number, manager?: EntityManager): Promise<boolean> { 
        const taskRepo = manager?.getRepository(Task) || this.taskRepository

        const task = await taskRepo.findOne({ where: { id: taskId, authorId: userId } })
        
        return task !== null
    }

    async getTask(taskId: number, manager?: EntityManager): Promise<Task> {
        const taskRepo = manager?.getRepository(Task) || this.taskRepository

        const task = await taskRepo.findOne({
            where: { id: taskId },
            relations: [ 'stringFields', 'numberFields', 'enumFields', 'author' ]
        })

        return task || undefined
    }


    async createTask(projectId: number, { title, description, fields, listId }: CreateTaskDto, userId: number, manager: EntityManager): Promise<Task> {
        const taskRepo = manager.getRepository(Task)
        const projectFieldsRepo = manager.getRepository(ProjectTaskField)
        const taskNumberRepo = manager.getRepository(TaskFieldNumber)
        const taskStringRepo = manager.getRepository(TaskFieldString) 
        const taskEnumRepo = manager.getRepository(TaskFieldEnum)

        const maxPosition = await taskRepo
            .createQueryBuilder('task')
            .select('MAX(task.position)', 'max')
            .where('task.listId = :id', { id: listId })
            .getRawOne();

        const currentPosition = maxPosition.max ? Number(maxPosition.max) + 1 : 1

        const task = new Task()
        task.title = title
        task.description = description
        task.authorId = userId
        task.projectId = projectId
        task.listId = listId
        task.position = currentPosition

        const projectFields = await projectFieldsRepo.find({ where: { projectId: projectId }, relations: [ 'enumOptions' ] })

        if(fields) {
            const stringFields = []
            const numberFields = []
            const enumFields = []

            for(let field of fields) {
                const pField = projectFields.find(e => e.id === field.id)
                if(!pField) throw new BadRequestException(`Field id(${field.id}) does not exist in project id(${projectId})`)

                switch(pField.type) {
                    case FieldType.String:
                        if(typeof field.value !== 'string') throw new BadRequestException(`Field id(${field.id}) must be string, got: ${typeof field.value}(${field.value})`)

                        const stringField = new TaskFieldString()
                        stringField.value = field.value
                        stringField.task = task
                        stringField.projectTaskFieldId = field.id
                        stringFields.push(stringField)
                        break
    
                    case FieldType.Number:
                        if(typeof field.value !== 'number') throw new BadRequestException(`Field id(${field.id}) must be number, got: ${typeof field.value}(${field.value})`)

                        const numberField = new TaskFieldNumber()
                        numberField.value = field.value
                        numberField.task = task
                        numberField.projectTaskFieldId = field.id
                        numberFields.push(numberField)
                        break
    
                    case FieldType.Enum:
                        if(typeof field.value !== 'number') throw new BadRequestException(`Field id(${field.id}) must be number, got: ${typeof field.value}(${field.value})`)
                        const index = field.value
                        if(index < 0 || pField.enumOptions.length <= index) throw new BadRequestException(`Field id(${field.id}) must be enum (0 <= N < ${pField.enumOptions.length}), got: ${field.value}`)
    
                        const enumField = new TaskFieldEnum()
                        enumField.value = index
                        enumField.task = task
                        enumField.projectTaskFieldId = field.id
                        enumFields.push(enumField)
                        break
                }
            }
            

            if(stringFields.length > 0) await taskStringRepo.save(stringFields)
            if(numberFields.length > 0) await taskNumberRepo.save(numberFields)
            if(enumFields.length > 0) await taskEnumRepo.save(enumFields)

            await taskRepo.save(task)

            task.stringFields = stringFields
            task.numberFields = numberFields
            task.enumFields = enumFields
        }

        const t = await this.getTask(task.id, manager)
        return t
    }

    //TODO: придумать решение через join
    async updateTask(taskId: number, { title, description, fields }: UpdateTaskDto, manager: EntityManager): Promise<Task> {
        const taskRepo = manager.getRepository(Task)
        const taskNumberRepo = manager.getRepository(TaskFieldNumber)
        const taskStringRepo = manager.getRepository(TaskFieldString)
        const taskEnumRepo = manager.getRepository(TaskFieldEnum)

        const task = await taskRepo.findOne({ where: { id: taskId }, relations: [ 'project.fields' ] })
        const project  = task.project

        task.title = title || task.title,
        task.description = description || task.description

        const taskFields = [...task.stringFields, ...task.numberFields, ...task.enumFields]
        const edittedStringFields = []
        const edittedNumberFields = []
        const edittedEnumFields = []

        if(fields) {
            fields.forEach(fieldUpdate => {
                const pField = project.fields.find(e => fieldUpdate.id === e.id)
                if(!pField) throw new BadRequestException(`Field id(${fieldUpdate.id}) does not exist in project id(${project.id})`)

                let tField = taskFields.find(e => e.projectTaskFieldId === fieldUpdate.id)

                switch(pField.type) {
                    case FieldType.Number:
                        if(typeof fieldUpdate.value !== 'number') throw new BadRequestException(`Field id(${fieldUpdate.id}) must be number`)
                        if(!tField) tField = new TaskFieldNumber()

                        tField.projectTaskFieldId = fieldUpdate.id
                        tField.value = fieldUpdate.value
                        tField.taskId = task.id

                        edittedNumberFields.push(tField)
                        break
                    case FieldType.String:
                        if(typeof fieldUpdate.value !== 'string') throw new BadRequestException(`Field id(${fieldUpdate.id}) must be string`)
                        if(!tField) tField = new TaskFieldString()

                        tField.projectTaskFieldId = fieldUpdate.id
                        tField.value = fieldUpdate.value
                        tField.taskId = task.id

                        edittedStringFields.push(tField)

                        break
                    case FieldType.Enum:
                        if(typeof fieldUpdate.value !== 'number' || fieldUpdate.value < 0 || fieldUpdate.value >= pField.enumOptions.length) throw new BadRequestException(`Field id(${fieldUpdate.id}) - invalid enum value, must be number ( 0 <= N < ${pField.enumOptions.length} ), got: ${typeof fieldUpdate.value}(${fieldUpdate.value})`)
                        if(!tField) tField = new TaskFieldEnum()

                        tField.projectTaskFieldId = fieldUpdate.id
                        tField.value = fieldUpdate.value
                        tField.taskId = task.id

                        edittedEnumFields.push(tField)

                        break
                }
            })
        }

        await taskStringRepo.save(edittedStringFields)
        await taskNumberRepo.save(edittedNumberFields)
        await taskEnumRepo.save(edittedEnumFields)
        await taskRepo.save(task)

        return await this.getTask(task.id, manager)
    }

    async deleteTask(taskId: number, manager: EntityManager) {
        const queryBuilder = manager.createQueryBuilder()
        const deleteResult = await queryBuilder.delete()
            .from(Task)
            .where("id = :taskId", { taskId })
            .returning('position, listId')
            .execute()

        const { position, listId } = deleteResult.raw[0]

        return await this.moveTasksUpFrom(position, listId, manager)
    }

    //TODO: оптимизировать
    async moveTask(taskId: number, { targetListId, newPosition }: MoveTaskDto, manager: EntityManager) {
        const task = await this.getTask(taskId, manager)

        const queryBuilder = manager.createQueryBuilder()

        if(task.listId !== targetListId) {
            await queryBuilder.update(Task)
                .set({
                    position: -1,
                    listId: targetListId
                })
                .where("listId = :listId", { listId: task.listId })
                .andWhere("position = :position", { position: task.position })
                .execute()
            
            await this.moveTasksUpFrom(task.position, task.listId, manager)
            await this.moveTasksDownFrom(newPosition, targetListId, manager)

            return await queryBuilder.update(Task)
                .set({
                    position: newPosition,
                })
                .where("listId = :targetListId", { targetListId })
                .andWhere("position = -1")
                .execute()
        }

        await queryBuilder.update(Task)
            .set({ position: -1 })
            .where("position = :from", { from: task.position })
            .andWhere("listId = :listId", { listId: task.listId })
            .execute()

        if (task.position < newPosition) {
            //Двигаем вниз
            await queryBuilder
                .update(Task)
                .set({ position: () => "position - 1" })
                .where("position > :from", { from: task.position })
                .andWhere("position <= :to", { to: newPosition })
                .andWhere("listId = :listId", { listId: task.listId })
                .execute();
        } else {
            //Двигаем вверх
            await queryBuilder
                .update(Task)
                .set({ position: () => "position + 1" })
                .where("position < :from", { from: task.position })
                .andWhere("position >= :to", { to: newPosition })
                .andWhere("listId = :listId", { listId: task.listId })
                .execute();
        }

        return await queryBuilder
            .update(Task)
            .set({ position: newPosition })
            .where("position = -1")
            .andWhere("listId = :listId", { listId: task.listId })
            .execute();
    }

    async moveTasksUpFrom(position: number, listId: number, manager?: EntityManager) {
        const queryBuilder = manager.createQueryBuilder() || this.taskRepository.createQueryBuilder()

        const result = await queryBuilder
            .update(Task)
            .set({
                position: () => "position - 1"
            })
            .where("position > :position", { position })
            .andWhere("listId = :listId",  { listId })
            .execute()

        return result.affected > 0
    }

    async moveTasksDownFrom(position: number, listId: number, manager?: EntityManager) {
        const queryBuilder = manager.createQueryBuilder() || this.taskRepository.createQueryBuilder()

        const result = await queryBuilder
            .update(Task)
            .set({
                position: () => 'position + 1'
            })
            .where("position >= :position", { position })
            .andWhere("listId = :listId", { listId })
            .execute()
        return result.affected > 0
    }

}
