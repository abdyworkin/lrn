import { IsNotEmpty, IsString } from "class-validator"



export class LoginDto {
    @IsNotEmpty()
    username: string
    @IsNotEmpty()
    password: string
}

export class RegistationDto {
    @IsString()
    username: string
    @IsString()
    password: string
}