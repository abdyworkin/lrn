import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { List } from '../list/list.entity';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';
import { TaskFieldEnum } from 'src/entities/task_field_enum.entity';
import { TaskFieldString } from 'src/entities/task_field_string.entity';
import { TaskFieldNumber } from 'src/entities/task_field_number.entity';
import { TaskLoadMiddleware } from './task.middleware';

@Module({
  controllers: [TaskController],
  providers: [TaskService, TaskLoadMiddleware],
  imports: [
    TypeOrmModule.forFeature([Task, List, Project, TaskFieldEnum, TaskFieldString, TaskFieldNumber]),
    ProjectModule,
    UserModule
  ],
  exports: [
    TaskService,
    TaskLoadMiddleware
  ]
})
export class TaskModule {}
