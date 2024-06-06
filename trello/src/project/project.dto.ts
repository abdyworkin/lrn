import { IsNumber, IsString } from "class-validator"

export class CreateProjectDto {
    @IsString()
    title: string

    @IsString()
    description: string
}

export class RenameProjectDto {
    @IsString()
    title: string
}


export class CreateListDto {
    @IsString()
    title: string
}

export class MoveListDto {
    @IsNumber()
    oldIndex: number
    
    @IsNumber()
    newIndex: number
}