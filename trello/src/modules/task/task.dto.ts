import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateTaskDto {
    @ApiProperty({ example: 'ЗАДАЧА 1', description: 'Заголовок задачи' })
    @IsString()
    title: string

    @ApiProperty({ example: 'ОПИСАНИЕ ЗАДАЧИ 1', description: 'Описание задачи' })
    @IsString()
    description: string

    @ApiProperty({ example: '1', description: 'Уникальный идентефикатор списков, в котором находится задача' })
    @IsNumber()
    listId: number

    @ApiProperty({ type: () => [FieldDto], description: "Значения полей" })
    @IsArray()
    @IsOptional()
    fields?: FieldDto[]
}

export class UpdateTaskDto {
    @ApiProperty({ example: 'ЗАДАЧА 1', description: 'Заголовок задачи' })
    @IsString()
    @IsOptional()
    title?: string

    @ApiProperty({ example: 'ОПИСАНИЕ ЗАДАЧИ 1', description: 'Описание задачи' })
    @IsString()
    @IsOptional()
    description?: string

    @ApiProperty({ type: () => [FieldDto], description: 'Обновленные значений полей' })
    @IsArray()
    @IsOptional()
    fields?: FieldDto[]
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

export class FieldDto {
    @ApiProperty({ example: '1', description: 'Уникальный индентификатор поля' })
    @IsNumber()
    id: number

    @ApiProperty({ example: '3000', description: 'Значение указанного поля'})
    value: number | string // в случае если поле enum, будет приходить порядковый номер варианта значения enum
}