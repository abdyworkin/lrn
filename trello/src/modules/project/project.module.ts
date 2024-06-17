import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { ProjectAccessGuard, ProjectCreatorGuard } from './project.guard';
import { ListModule } from '../list/list.module';
import { UserToProject } from '../../entities/user_to_project.entity';
import { Project } from './project.entity';
import { ProjectTaskFieldEnumOptions, ProjectTaskFields } from 'src/entities/project_field.entity';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAccessGuard, ProjectCreatorGuard],
  imports: [
    TypeOrmModule.forFeature([Project, UserToProject, ProjectTaskFields, ProjectTaskFieldEnumOptions]),
    UserModule,
    forwardRef(() => ListModule)
  ],
  exports: [ ProjectService, ProjectAccessGuard ]
})
export class ProjectModule {
}
