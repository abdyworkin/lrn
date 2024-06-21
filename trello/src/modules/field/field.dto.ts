import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, IsString, IsArray, IsOptional } from "class-validator"
import { FieldType } from "src/modules/field/project_field.entity"

export class AddFieldDto {
    @ApiProperty({ example: 'enum', description: 'Тип нового поля: number | string | enum' })
    @IsEnum(FieldType)
    type: FieldType

    @ApiProperty({ example: 'Важность задачи' })
    @IsString()
    title: string

    @ApiPropertyOptional({ example: ['Важно', 'Неважно'], description: 'Варианты для enum' })
    @IsArray()
    @IsOptional()
    options?: string[]
}

export class EditFieldDto {
    @ApiProperty({ example: '1', description: "Уникальный индентификатор редактируемого поля" })
    id: number

    @ApiPropertyOptional({ example: 'enum', description: 'Тип нового поля: number | string | enum' })
    @IsEnum(FieldType)
    @IsOptional()
    type?: FieldType

    @ApiPropertyOptional({ example: 'НАЗВАНИЕ ПОЛЯ' })
    @IsString()
    @IsOptional()
    title?: string

    @ApiPropertyOptional({ example: ['Важно', 'Неважно'], description: 'Варианты для enum' })
    @IsArray()
    @IsOptional()
    options?: string[]
}