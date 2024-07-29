import { Inject, Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { FieldValue, FieldValueKeys } from './fieldval.dto';
import { Task } from '../task/task.entity';
import { Project } from '../project/project.entity';

@Injectable()
export class FieldvalService {
    constructor(
        @Inject("FIELDS_SERVICE") private readonly client: ClientProxy,
    ){}

    async create(fields: FieldValue[]): Promise<boolean> {
        const response = await firstValueFrom(this.client.send({ action: "fields.create" }, { fields }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) {
                    throw new ServiceUnavailableException('Feilds service timeout')
                }
                return err
            })
        ))

        if(response.type && response.type === 'error') {
            throw new InternalServerErrorException(response.message)
        }

        return response.result
    }

    async update(fields: FieldValue[]): Promise<boolean> {
        const response = await firstValueFrom(this.client.send({ action: "fields.update"}, { fields }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) {
                    throw new ServiceUnavailableException('Fields service timeout')
                }
                return err
            })
        ))

        if(response.type && response.type === 'error') throw new InternalServerErrorException(response.message)

        return response.result
    }

    async delete(fieldIds: FieldValueKeys[]): Promise<boolean> {
        const response = await firstValueFrom(this.client.send({ action: "fields.delete" }, { fieldIds }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) throw new ServiceUnavailableException('Fields service timeout')
                return err
            })
        ))

        if(response.type && response.type === 'error') throw new InternalServerErrorException(response.message)

        return response.result
    }

    async deleteByTask(taskIds: number[]): Promise<boolean> {
        const response = await firstValueFrom(this.client.send({ action: "fields.delete.taskid" }, { taskIds }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) throw new ServiceUnavailableException('Fields service timeout')
                return err
            })
        ))

        if(response.type && response.type === 'error') throw new InternalServerErrorException(response.message)

        return response.result
    }

    async deleteByField(fieldIds: number[]): Promise<boolean> {
        const response = await firstValueFrom(this.client.send({ action: "fields.delete.fieldid" }, { fieldIds }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) throw new ServiceUnavailableException('Fields service timeout')
                return err
            })
        ))

        if(response.type && response.type === 'error') throw new InternalServerErrorException(response.message)
        return response.result
    }

    async get(fieldIds: FieldValueKeys[]): Promise<FieldValue[]> {
        const response = await firstValueFrom(this.client.send({ action: "fields.get" }, { fieldIds }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) throw new ServiceUnavailableException('Fields service timeout')
                return err
            })
        ))

        if(response.type && response.type === 'error') throw new InternalServerErrorException(response.message)

        return response.fields
    }

    async getByTask(taskIds: number[]): Promise<FieldValue[]> {
        const response = await firstValueFrom(this.client.send({ action: "fields.get.taskid" }, { taskIds }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) throw new ServiceUnavailableException('Fields service timeout')
                return err
            })
        ))

        if(response.type && response.type === 'error') throw new InternalServerErrorException(response.message)

        return response.fields
    }

    async getByField(fieldIds: number[]): Promise<FieldValue[]> {
        const response = await firstValueFrom(this.client.send({ action: "fields.get.fieldid" }, { fieldIds }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) throw new ServiceUnavailableException('fields service timeout')
                return err
            })
        ))

        if(response.type && response.type === 'error') throw new InternalServerErrorException(response.message)

        return response.fields
    }

    async populateProject(project: Project): Promise<Project> {
        const taskMap: { [id: number]: FieldValue[] } = {}
        const fieldValues = await this.getByField(project.fields.map(e => e.id))

        fieldValues.forEach(e => {
            if(!(e.taskId in taskMap)) {
                taskMap[e.taskId] = []
            }
            taskMap[e.taskId].push(e)
        })
        
        for(let i = 0; i < project.lists.length; i++) {
            for(let j = 0; j < project.lists[i].tasks.length; j++) {
                const task = project.lists[i].tasks[j]
                task.fields = taskMap[task.id]
            }
        }

        return project
    }

    async populateTask(task: Task): Promise<Task> {
        const fields = await this.getByTask([task.id])
        task.fields = fields

        return task
    }
}
