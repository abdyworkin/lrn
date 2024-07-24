import { Module, forwardRef } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { ProjectModule } from '../project/project.module';
import { List } from '../list/list.entity';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';
import { TaskFieldEnum } from 'src/entities/task_field_enum.entity';
import { TaskFieldString } from 'src/entities/task_field_string.entity';
import { TaskFieldNumber } from 'src/entities/task_field_number.entity';
import { ListModule } from '../list/list.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [TaskController],
  providers: [TaskService],
  imports: [
    TypeOrmModule.forFeature([Task, List, Project, TaskFieldEnum, TaskFieldString, TaskFieldNumber]),
    forwardRef(() => ProjectModule),
    forwardRef(() => ListModule),
    AuthModule,
  ],
  exports: [
    TaskService,
  ]
})
export class TaskModule {}
