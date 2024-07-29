import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, FieldDto, MoveTaskDto, UpdateTaskDto } from './task.dto';
import { ProjectTaskField } from 'src/modules/field/project_field.entity';
import { AuthService } from '../auth/auth.service';
import { FieldvalService } from '../fieldval/fieldval.service';
import { FieldValue } from '../fieldval/fieldval.dto';

@Injectable()
export class TaskService {  
    constructor(
        private readonly authService: AuthService,
        private readonly fieldvalService: FieldvalService,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        private readonly dataSource: DataSource,
    ) {}

    async runInTransaction(func: (manager: EntityManager) => Promise<any>) {
        const result = await this.dataSource.transaction(async manager => {
                return await func(manager)
        })
        return result
    }

    async isTaskAuthor(taskId: number, userId: number, manager?: EntityManager): Promise<boolean> { 
        const taskRepo = manager?.getRepository(Task) || this.taskRepository

        const task = await taskRepo.findOne({ where: { id: taskId, authorId: userId } })
        
        return task !== null
    }

    async getTask(taskId: number, manager?: EntityManager): Promise<Task> {
        const taskRepo = manager?.getRepository(Task) || this.taskRepository

        const task = await taskRepo.findOne({where: { id: taskId }})

        if(!task) return undefined

        await this.fieldvalService.populateTask(task)

        return await this.populateAuthor(task)
    }


    async createTask(projectId: number, { title, description, fields, listId }: CreateTaskDto, userId: number, manager: EntityManager): Promise<Task> {
        const taskRepo = manager.getRepository(Task)
        const projectFieldsRepo = manager.getRepository(ProjectTaskField)
        
        const maxPosition = await taskRepo
            .createQueryBuilder('task')
            .select('MAX(task.position)', 'max')
            .where('task.listId = :id', { id: listId })
            .getRawOne();

        const currentPosition = maxPosition.max ? Number(maxPosition.max) + 1 : 1

        const projectFields = await projectFieldsRepo.find({ where: { projectId }, relations: ['enumOptions'] })

        this.validateFields(projectFields, fields)

        let task = new Task()
        task.title = title
        task.description = description
        task.authorId = userId
        task.projectId = projectId
        task.listId = listId
        task.position = currentPosition

        await taskRepo.save(task)

        if(fields) {
            const fieldValues = fields.map(e => {
                const pf = projectFields.find(i => i.id === e.id)

                return {
                    taskId: task.id,
                    fieldId: e.id,
                    type: pf.type,
                    value: e.value,
                } 
            }) satisfies FieldValue[]

            const result = await this.fieldvalService.create(fieldValues)

            if(!result) throw new InternalServerErrorException("error editting fieldV values")
        }

        task = await this.populateAuthor(task)

        return await this.fieldvalService.populateTask(task)
    }

    async updateTask(taskId: number, { title, description, fields }: UpdateTaskDto, manager: EntityManager): Promise<Task> {
        const taskRepo = manager.getRepository(Task)
        const projectFieldsRepo = manager.getRepository(ProjectTaskField)

        const task = await this.getTask(taskId, manager)

        if(!task) throw new NotFoundException(`Task id(${taskId}) not found`)

        const projectFields = await projectFieldsRepo.find({ where: { projectId: task.projectId }, relations: ['enumOptions'] })

        this.validateFields(projectFields, fields)

        task.title = title || task.title,
        task.description = description || task.description

        const taskWithAuthor = await this.populateAuthor(task)

        if(fields) {
            const fieldValues = fields.map(e => {
                const pf = projectFields.find(i => i.id === e.id)
                return {
                    taskId: taskId,
                    fieldId: e.id,
                    type: pf.type,
                    value: e.value,
                } 
            }) satisfies FieldValue[]

            const result = await this.fieldvalService.update(fieldValues)

            if(!result) throw new InternalServerErrorException("error editting fieldV values")
        }

        const taskWithFields = await this.fieldvalService.populateTask(taskWithAuthor)

        return taskWithFields
    }

    async deleteTask(taskId: number, manager: EntityManager) {
        const queryBuilder = manager.createQueryBuilder()
        const deleteResult = await queryBuilder.delete()
            .from(Task)
            .where("id = :taskId", { taskId })
            .returning('position, listId')
            .execute()

        if(!deleteResult.raw[0]) throw new NotFoundException(`Task id(${taskId}) not found`)

        const { position, listId } = deleteResult.raw[0]

        const moveResult = await this.moveTasksUpFrom(position, listId, manager)
        
        if(moveResult) {
            return await this.fieldvalService.deleteByTask([ taskId ])
        }

        return moveResult
    }

    async moveTask(taskId: number, { targetListId, newPosition }: MoveTaskDto, manager: EntityManager) {
        //TODO: добавить проверку входных данных

        const task = await this.getTask(taskId, manager)

        if(!task) throw new NotFoundException(`Task id(${taskId}) not found`)

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

        return true
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

    private async populateAuthor(task: Task): Promise<Task> {
        const author = (await this.authService.getUsersByIds([ task.authorId ]))[0]

        if(!author) return task

        task.author = author

        return task
    }

    private validateFields(projectFields: ProjectTaskField[], fields: FieldDto[]) {
        const projectFieldsMap = {}
        projectFields.forEach(e => {
            projectFieldsMap[e.id] = e
        })

        for(let field of fields) {
            if (!(field.id in projectFieldsMap)) throw new BadRequestException(`field id (${field.id}) is not represented in project`)

            const pf = projectFieldsMap[field.id]
            if (pf.type === "string" && typeof field.value !== "string") throw new BadRequestException(`field id(${field.id}) must be string, got: ${typeof field.value}`)
            if (pf.type === "number" && typeof field.value !== "number") throw new BadRequestException(`field id(${field.id}) must be number, got: ${typeof field.value}`)
            if (pf.type === 'enum') {
                if (typeof field.value !== "number") throw new BadRequestException(`field id(${field.id}) must be number, got: ${typeof field.value}`)
                if (field.value < 0 || field.value >= pf.enumOptions.length) throw new BadRequestException(`field id(${field.id}) is enum, acceptable range [0, ${pf.enumOptions.length-1}], got: ${field.value}`)
            }
        }
    }
}
