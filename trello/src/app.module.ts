import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './modules/user/user.entity';
import { ListModule } from './modules/list/list.module';
import { List } from './modules/list/list.entity';
import { Project } from './modules/project/project.entity';
import { Task } from './modules/task/task.entity';
import { UserToProject } from './entities/user_to_project.entity';
import { ProjectTaskFieldEnumOptions, ProjectTaskFields } from './entities/project_field.entity';
import { TaskFieldEnum } from './entities/task_field_enum.entity';
import { TaskFieldString } from './entities/task_field_string.entity';
import { TaskFieldNumber } from './entities/task_field_number.entity';

//TODO: подключать через директорию
const entities = [
  User, 
  Project, 
  Task, 
  UserToProject, 
  List,
  ProjectTaskFields,
  ProjectTaskFieldEnumOptions,
  TaskFieldEnum,
  TaskFieldString,
  TaskFieldNumber,
]

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProjectModule,
    TaskModule,
    ListModule,

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
      synchronize: true
    }),

    ListModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
