import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { User } from './user/user.repo';
import { List, Project, UserToProject } from './project/project.repo';
import { Task } from './task/task.repo';
import { ConfigModule } from '@nestjs/config';

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
      entities: [User, Task, List, Project, UserToProject],
      synchronize: true
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
