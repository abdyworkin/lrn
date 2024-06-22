import { Module, forwardRef } from '@nestjs/common';
import { FieldController } from './field.controller';
import { FieldService } from './field.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTaskField, ProjectTaskFieldEnumOptions } from 'src/modules/field/project_field.entity';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';

@Module({
  controllers: [FieldController],
  providers: [FieldService],
  imports: [
    TypeOrmModule.forFeature([ProjectTaskField, ProjectTaskFieldEnumOptions]),
    UserModule,
    forwardRef(() => ProjectModule),
    forwardRef(() => TaskModule),
  ],
  exports: [FieldService]
})
export class FieldModule {}
