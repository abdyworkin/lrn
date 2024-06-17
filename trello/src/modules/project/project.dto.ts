import { ApiProperty, ApiPropertyOptional, ApiRequestTimeoutResponse } from "@nestjs/swagger"
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString } from "class-validator"
import { FieldType } from "src/entities/project_field.entity"

export class CreateProjectDto {
    @ApiProperty({ example: "ПРОЕКТ 1", description: "Описание проекта" })
    @IsString()
    title: string

    @ApiProperty({ example: "ОПИСАНИЕ ПРОЕКТА 1", description: "Описание проекта"})
    @IsString()
    description: string

    @ApiProperty({ type: () => [AddFieldDto], description: 'Дополнительные поля для задач' })
    @IsOptional()
    @IsArray()
    fields?: AddFieldDto[]
}

export class UpdateProjectMetaDto {
    @ApiPropertyOptional({ example: 'Новое название проекта', description: 'Название проекта' })
    @IsOptional()
    @IsString()
    title?: string

    @ApiPropertyOptional({ example: 'Новое описание проекта', description: "Описание проекта" })
    @IsOptional()
    @IsString()
    description?: string

    @ApiPropertyOptional({ type: () => [EditFieldDto], description: 'Дполнительные поля для задач' })
    @IsOptional()
    @IsArray()
    fields?: EditFieldDto[]
}

export class KickUserFromProjectDto {
    @ApiPropertyOptional({ example: true, description: 'Дополнительный параметр, указывающий, разрешено ли пользователю повторно присоедениться по ссылке к проекту' })
    @IsOptional()
    @IsBoolean()
    ban: boolean
}

export class AddFieldDto {
    @ApiProperty({ example: 'enum', description: 'Тип нового поля: number | string | enum' })
    @IsEnum(FieldType)
    type: FieldType

    @ApiProperty({ example: 'Важность задачи' })
    @IsString()
    title: string

    @ApiPropertyOptional({ example: ['Важно', 'Неважно'], description: 'Варианты для enum' })
    @IsArray()
    options?: string[]
}

export class EditFieldDto {
    @ApiProperty({ example: '1', description: "Уникальный индентификатор редактируемого поля" })
    id: number

    @ApiPropertyOptional({ example: 'enum', description: 'Тип нового поля: number | string | enum' })
    @IsEnum(FieldType)
    type?: FieldType

    @ApiPropertyOptional({ example: 'НАЗВАНИЕ ПОЛЯ' })
    @IsString()
    title?: string

    @ApiPropertyOptional({ example: ['Важно', 'Неважно'], description: 'Варианты для enum' })
    @IsArray()
    options?: string[]
}