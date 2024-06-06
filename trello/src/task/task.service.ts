import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.repo';
import { Repository } from 'typeorm';

@Injectable()
export class TaskService {  

    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>
    ) {}


    async createTask(
        data: {
            authorId: number
            description?: string
            title: string
            listId: number
        }
    ) {
        const task = new Task()
        
        task.author = data.authorId
        task.description = data.description
        task.title = data.title
        task.list = data.listId

        return await this.taskRepository.save(task)
    }

    async findTaskById(id: number) {
        return await this.taskRepository.findOneBy({ id })
    }

    async getAllTasks() {
        return await this.taskRepository.find()
    }

    async deleteTask(id: number) {
        return await this.taskRepository.delete({ id })
    }

    async moveTask(listId: number, newIndex: number) {
    }
}
