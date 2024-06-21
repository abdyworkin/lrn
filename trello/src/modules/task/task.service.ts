import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from './task.entity';
import { FieldDto } from './task.dto';
import { Project } from '../project/project.entity';
import { FieldType } from 'src/modules/field/project_field.entity';
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

    async getTask(taskId: number): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: [ 'stringFields', 'numberFields', 'enumFields', 'author' ]
        })

        return task || undefined
    }

    async createTask({ title, description, listId, project, user, fields }: {
        title: string,
        description: string,
        listId: number,
        project: Project,
        user: User,
        fields?: FieldDto[]
    }): Promise<Task> {
        if(!project.lists.find(e => e.id === listId)) throw new NotFoundException(`List id(${listId}) not exists`)

        const maxPosition = await this.taskRepository
            .createQueryBuilder('task')
            .select('MAX(task.position)', 'max')
            .where('task.listId = :id', { id: listId })
            .getRawOne();

        const currentPosition = maxPosition.max ? Number(maxPosition.max) + 1 : 1

        const task = new Task()
        task.title = title
        task.description = description
        task.author = user
        task.authorId = user.id
        task.projectId = project.id
        task.listId = listId
        task.position = currentPosition

        //Идея в том, чтобы потом вызвать минимальное количество .save
        //TODO: не создавать нулевые строки
        if(fields) {
            const stringFields = []
            const numberFields = []
            const enumFields = []

            project.fields.forEach(field => {
                const e = fields.find(f => f.id === field.id)
                switch(field.type) {
                    case FieldType.String:
                        if(e !== undefined && typeof e.value !== 'string') throw new BadRequestException(`Field ${field.title} id(${field.id}) must contain string value`)

                        const stringField = new TaskFieldString()
                        stringField.value = (e?.value as string) ?? null
                        stringField.task = task
                        stringField.projectTaskFieldId = field.id
                        stringFields.push(stringField)
                        break

                    case FieldType.Number:
                        if(e !== undefined && typeof e.value !== 'number') throw new BadRequestException(`Field ${field.title} id(${field.id}) must contain number value`)
                        const numberField = new TaskFieldNumber()
                        numberField.value = (e?.value as number) ?? null
                        numberField.task = task
                        numberField.projectTaskFieldId = field.id
                        numberFields.push(numberField)
                        break

                    case FieldType.Enum:
                        if(e !== undefined && typeof e.value !== 'number') throw new BadRequestException(`Field ${field.title} id(${field.id}) must contain enum(0 <= N < ${field.enumOptions.length}) value`)
                        const index = (e?.value as number) ?? null
                        if(e !== undefined && (field.enumOptions.length <= index || index < 0)) throw new BadRequestException(`Field ${field.title} id(${field.id}) must contain enum(0 <= N < ${field.enumOptions.length}) value`)

                        const enumField = new TaskFieldEnum()
                        enumField.value = index
                        enumField.task = task
                        enumField.projectTaskFieldId = field.id
                        enumFields.push(enumField)
                        break
                }
            })

            if(stringFields.length > 0) await this.taskFieldStringRepository.save(stringFields)
            if(numberFields.length > 0) await this.taskFieldNumberRepository.save(numberFields)
            if(enumFields.length > 0) await this.taskFieldEnumRepository.save(enumFields)


            await this.taskRepository.save(task)

            task.stringFields = stringFields
            task.numberFields = numberFields
            task.enumFields = enumFields
        }

        return task
    }

    async updateTask({ project, task, title, description, fields }: {
        project: Project,
        task: Task
        title?: string,
        description?: string,
        fields?: FieldDto[],
    }): Promise<Task> {
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

        await this.taskFieldStringRepository.save(edittedStringFields)
        await this.taskFieldNumberRepository.save(edittedNumberFields)
        await this.taskFieldEnumRepository.save(edittedEnumFields)
        await this.taskRepository.save(task)

        return await this.getTask(task.id)
    }

    async deleteTask({ taskId }: {
        taskId: number
    }) {
        const result = await this.dataSource.transaction(async manager => {
            const queryBuilder = manager.createQueryBuilder()
            const deleteResult = await queryBuilder.delete()
                .from(Task)
                .where("id = :taskId", { taskId })
                .returning('position, listId')
                .execute()

            const { position, listId } = deleteResult.raw[0]

            return await this.moveTasksUpFrom(position, listId, queryBuilder)
        })

        return result
    }

    async moveTask({ targetListId, newPosition, task }: {
        targetListId: number,
        newPosition: number,
        task: Task
    }) {
        targetListId = targetListId || task.listId

        const result = await this.dataSource.transaction(async manager => {
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
                
                await this.moveTasksUpFrom(task.position, task.listId, queryBuilder)
                await this.moveTasksDownFrom(newPosition, targetListId, queryBuilder)

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
        })

        return result.affected > 0
    }

    async moveTasksUpFrom(position: number, listId: number, qb?: SelectQueryBuilder<any>) {
        const queryBuilder = qb || this.taskRepository.createQueryBuilder()
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

    async moveTasksDownFrom(position: number, listId: number, qb?: SelectQueryBuilder<any>) {
        const queryBuilder = qb || this.taskRepository.createQueryBuilder()
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
