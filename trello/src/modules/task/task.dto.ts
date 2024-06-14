import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";


export class CreateTaskDto {
    @ApiProperty({ example: 'Что-то дописать', description: 'Заголовок задачи' })
    @IsString()
    title: string

    @ApiProperty({ example: 'Где-то тут, что-то там, туда-сюда сделай', description: 'Описание задачи' })
    @IsString()
    description: string

    @ApiProperty({ example: '1', description: 'Уникальный идентефикатор списков, в котором находится задача' })
    @IsNumber()
    listId: number
}


export class UpdateTaskDto {
    @ApiProperty({ example: 'Что-то дописать', description: 'Заголовок задачи' })
    @IsString()
    @IsOptional()
    title?: string

    @ApiProperty({ example: 'Где-то тут, что-то там, туда-сюда сделай', description: 'Описание задачи' })
    @IsString()
    @IsOptional()
    description?: string
}

export class MoveTaskDto {
    @ApiProperty({ example: '3', description: 'Номер позиции, на которую хотят переместить задачу' })
    @IsNumber()
    newPosition: number

    @ApiProperty({ example: '33', description: 'Уникальный идентефикатор списка, куда хотят переместить задачу' })
    @IsNumber()
    @IsOptional()
    targetListId?: number
}