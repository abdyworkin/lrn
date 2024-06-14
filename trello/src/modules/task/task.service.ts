import { Injectable } from '@nestjs/common';
import { DependenciesScanner } from '@nestjs/core/scanner';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { CustomRepositoryCannotInheritRepositoryError, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class TaskService {  

    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        private readonly dataSource: DataSource,
    ) {}


    async getTask(taskId: number): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: [ 'project.users.user' ]
        })

        return task || undefined
    }


    async createTask({ title, description, listId, projectId, user }: {
        title: string,
        description: string,
        listId: number,
        projectId: number,
        user: User
    }): Promise<Task> {
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
        task.projectId = projectId
        task.listId = listId
        task.position = currentPosition

        return await this.taskRepository.save(task)
    }

    async updateTask({ taskId, title, description }: {
        taskId: number
        title?: string,
        description?: string,
    }): Promise<Task> {
        const result = await this.taskRepository.createQueryBuilder()
            .update(Task)
            .set({
                title,
                description
            })
            .where("id = :taksId", { taskId })
            .returning('*')
            .execute()

        return result.generatedMaps[0] as Task
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
