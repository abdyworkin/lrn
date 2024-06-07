import { IsNumber, IsOptional, IsString } from "class-validator"

export class CreateProjectDto {
    @IsString()
    title: string

    @IsString()
    description: string
}

export class UpdateProjectMetaDto {
    @IsOptional()
    @IsString()
    title: string

    @IsOptional()
    @IsString()
    description: string
}