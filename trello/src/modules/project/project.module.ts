import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { ListModule } from '../list/list.module';
import { UserToProject } from '../../entities/user_to_project.entity';
import { Project } from './project.entity';
import { ProjectTaskFieldEnumOptions, ProjectTaskField } from 'src/modules/field/project_field.entity';
import { FieldModule } from '../field/field.module';
import { TaskModule } from '../task/task.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [
    TypeOrmModule.forFeature([Project, UserToProject, ProjectTaskField, ProjectTaskFieldEnumOptions]),
    forwardRef(() => ListModule),
    forwardRef(() => TaskModule),
    forwardRef(() => FieldModule),
    AuthModule,
  ],
  exports: [ ProjectService ]
})
export class ProjectModule {
}
