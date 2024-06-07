import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user';
import { List } from './entities/list';
import { Project } from './entities/project';
import { Task } from './entities/task';
import { UserToProject } from './entities/user_to_project';

const entities = [
  User, 
  Project, 
  Task, 
  UserToProject, 
  List
]

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProjectModule,
    TaskModule,

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
