import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { Project } from 'src/entities/project';
import { UserToProject } from 'src/entities/user_to_project';
import { UserModule } from '../user/user.module';
import { ProjectAccessGuard, ProjectCreatorGuard } from './project.guard';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAccessGuard, ProjectCreatorGuard],
  imports: [
    TypeOrmModule.forFeature([Project, UserToProject]),
    forwardRef(() => UserModule)
  ],
})
export class ProjectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
  
}
