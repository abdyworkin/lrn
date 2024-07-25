import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { ConfigModule } from '@nestjs/config';
import { ListModule } from './modules/list/list.module';
import { List } from './modules/list/list.entity';
import { Project } from './modules/project/project.entity';
import { Task } from './modules/task/task.entity';
import { UserToProject } from './entities/user_to_project.entity';
import { ProjectTaskFieldEnumOptions, ProjectTaskField } from './modules/field/project_field.entity';
import { TaskFieldEnum } from './entities/task_field_enum.entity';
import { TaskFieldString } from './entities/task_field_string.entity';
import { TaskFieldNumber } from './entities/task_field_number.entity';
import { FieldModule } from './modules/field/field.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from './modules/auth/auth.module';
import { FieldvalModule } from './modules/fieldval/fieldval.module';

const entities = [
  Project, 
  Task, 
  UserToProject, 
  List,
  ProjectTaskField,
  ProjectTaskFieldEnumOptions,
  TaskFieldEnum,
  TaskFieldString,
  TaskFieldNumber,
]

@Module({
  imports: [
    AuthModule,
    ProjectModule,
    TaskModule,
    ListModule,
    FieldModule,

    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER || 'root',
      password: process.env.POSTGRES_PASSWORD || 'root',
      database: process.env.POSTGRES_DB || 'trello',
      entities: entities,
      synchronize: true,
    }),

    FieldvalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
