import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { ListService } from './list.service';
import { ListController } from './list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../project/project.module';
import { List } from './list.entity';
import { TaskModule } from '../task/task.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [ListService],
  controllers: [ListController],
  imports: [
    TypeOrmModule.forFeature([List]),
    forwardRef(() => TaskModule),
    forwardRef(() => ProjectModule),
    AuthModule,
  ],
  exports: [ ListService ]
})
export class ListModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}
