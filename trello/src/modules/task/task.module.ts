import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { List } from '../list/list.entity';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';

@Module({
  controllers: [TaskController],
  providers: [TaskService],
  imports: [
    TypeOrmModule.forFeature([Task, List, Project]),
    ProjectModule,
    UserModule
  ],
})
export class TaskModule {}
