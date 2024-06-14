import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class LoginDto {
    @ApiProperty({ example: "lehazver2012", description: "Уникальное имя пользователя" })
    @IsNotEmpty()
    username: string

    @ApiProperty({ example: 'lehamawina', description: "Совершенно секретный пароль" })
    @IsNotEmpty()
    password: string
}

export class RegistationDto {
    @ApiProperty({ example: "lehazver2012", description: "Уникальное имя пользователя" })
    @IsString()
    username: string

    @ApiProperty({ example: 'lehamawina', description: "Совершенно секретный пароль" })
    @IsString()
    password: string
}