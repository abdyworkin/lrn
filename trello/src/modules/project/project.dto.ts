import { ApiProperty, ApiPropertyOptional, ApiRequestTimeoutResponse } from "@nestjs/swagger"
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString } from "class-validator"
import { FieldType } from "src/modules/field/project_field.entity"
import { AddFieldDto, EditFieldDto } from "../field/field.dto"

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

export class UpdateProjectDto {
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
