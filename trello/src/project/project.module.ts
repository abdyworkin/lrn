import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List, Project, UserToProject } from './project.repo';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [TypeOrmModule.forFeature([Project, List, UserToProject]), UserModule],
})
export class ProjectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}
