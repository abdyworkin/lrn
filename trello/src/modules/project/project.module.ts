import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { ListModule } from '../list/list.module';
import { UserToProject } from '../../entities/user_to_project.entity';
import { Project } from './project.entity';
import { ProjectTaskFieldEnumOptions, ProjectTaskField } from 'src/modules/field/project_field.entity';
import { FieldModule } from '../field/field.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [
    TypeOrmModule.forFeature([Project, UserToProject, ProjectTaskField, ProjectTaskFieldEnumOptions]),
    UserModule,
    forwardRef(() => ListModule),
    forwardRef(() => FieldModule)
  ],
  exports: [ ProjectService ]
})
export class ProjectModule {
}
