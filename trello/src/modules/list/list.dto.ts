import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsNumber, IsOptional, IsString } from "class-validator"


export class CreateListDto {
    @ApiProperty({ example: 'Предстоит сделать', description: 'Заголовок списка задач' })
    @IsString()
    title: string

    @ApiProperty({ example: 'Не стесняемся - берем', description: 'Описание списка задач' })
    @IsString()
    description: string
}

export class UpdateListMetaDto {
    @ApiPropertyOptional({ example: 'Предстоит сделать', description: 'Заголовок списка задач' })
    @IsOptional()
    @IsString()
    title?: string

    @ApiPropertyOptional({ example: 'Не стесняемся - берем', description: 'Описание списка задач' })
    @IsOptional()
    @IsString()
    description?: string
}


export class MoveListDto {
    @ApiProperty({ example: 3, description: 'Позиция, на которую перемещается список задач' })
    @IsNumber()
    to: number
}