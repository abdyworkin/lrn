import { Module, forwardRef } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { ProjectModule } from '../project/project.module';
import { List } from '../list/list.entity';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';
import { ListModule } from '../list/list.module';
import { AuthModule } from '../auth/auth.module';
import { FieldvalModule } from '../fieldval/fieldval.module';

@Module({
  controllers: [TaskController],
  providers: [TaskService],
  imports: [
    TypeOrmModule.forFeature([Task, List, Project]),
    forwardRef(() => ProjectModule),
    forwardRef(() => ListModule),
    AuthModule,
    FieldvalModule,
  ],
  exports: [
    TaskService,
  ]
})
export class TaskModule {}
