import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { ListService } from './list.service';
import { ListController } from './list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { List } from './list.entity';

@Module({
  providers: [ListService],
  controllers: [ListController],
  imports: [
    TypeOrmModule.forFeature([List]),
    UserModule,
    forwardRef(() => ProjectModule)
  ],
  exports: [ ListService ]
})
export class ListModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}
