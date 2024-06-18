import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsNumber, IsOptional, IsString } from "class-validator"


export class CreateListDto {
    @ApiProperty({ example: 'СПИСОК 1', description: 'Заголовок списка задач' })
    @IsString()
    title: string

    @ApiProperty({ example: 'ОПИСАНИЕ СПИСКА 1', description: 'Описание списка задач' })
    @IsString()
    description: string
}

export class UpdateListMetaDto {
    @ApiPropertyOptional({ example: 'СПИСОК 1', description: 'Заголовок списка задач' })
    @IsOptional()
    @IsString()
    title?: string

    @ApiPropertyOptional({ example: 'ОПИСАНИЕ СПИСКА 1', description: 'Описание списка задач' })
    @IsOptional()
    @IsString()
    description?: string
}


export class MoveListDto {
    @ApiProperty({ example: 3, description: 'Позиция, на которую перемещается список задач' })
    @IsNumber()
    to: number
}