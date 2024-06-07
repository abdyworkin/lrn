import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/entities/task';
import { Repository } from 'typeorm';

@Injectable()
export class TaskService {  

    constructor(
    ) {}

}
