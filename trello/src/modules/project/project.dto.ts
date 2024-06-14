import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateProjectDto {
    @ApiProperty({ example: "Важный проект", description: "Описание проекта" })
    @IsString()
    title: string

    @ApiProperty({ example: "Выполняем тут важные дела для важного проекта", description: "Описание проекта"})
    @IsString()
    description: string
}

export class UpdateProjectMetaDto {
    @ApiPropertyOptional({ example: 'Новое название проекта', description: 'Название проекта' })
    @IsOptional()
    @IsString()
    title: string

    @ApiPropertyOptional({ example: 'Новое описание проекта', description: "Описание проекта" })
    @IsOptional()
    @IsString()
    description: string
}

export class KickUserFromProjectDto {
    @ApiPropertyOptional({ example: true, description: 'Дополнительный параметр, указывающий, разрешено ли пользователю повторно присоедениться по ссылке к проекту' })
    @IsOptional()
    @IsBoolean()
    ban: boolean
}
