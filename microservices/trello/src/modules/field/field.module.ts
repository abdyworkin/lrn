import { Module, forwardRef } from '@nestjs/common';
import { FieldController } from './field.controller';
import { FieldService } from './field.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTaskField, ProjectTaskFieldEnumOptions } from 'src/modules/field/project_field.entity';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { AuthModule } from '../auth/auth.module';
import { FieldvalModule } from '../fieldval/fieldval.module';

@Module({
  controllers: [FieldController],
  providers: [FieldService],
  imports: [
    TypeOrmModule.forFeature([ProjectTaskField, ProjectTaskFieldEnumOptions]),
    forwardRef(() => ProjectModule),
    AuthModule,
    forwardRef(() => TaskModule),
    FieldvalModule,
  ],
  exports: [FieldService]
})
export class FieldModule {}
