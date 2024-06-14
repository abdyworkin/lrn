import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { ProjectAccessGuard, ProjectCreatorGuard } from './project.guard';
import { ListModule } from '../list/list.module';
import { UserToProject } from '../../entities/user_to_project.entity';
import { Project } from './project.entity';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAccessGuard, ProjectCreatorGuard],
  imports: [
    TypeOrmModule.forFeature([Project, UserToProject]),
    UserModule,
    forwardRef(() => ListModule)
  ],
  exports: [ ProjectService, ProjectAccessGuard ]
})
export class ProjectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
  
}
