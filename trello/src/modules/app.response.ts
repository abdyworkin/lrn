import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";


export class ResultResponse {
    @ApiProperty({ example: true, description: "Статус выполнения" })
    result: boolean
}

export class ErrorResponse {
    @ApiPropertyOptional({ example: 'auth/user-not-found', description: "Сообщение ошибки" })
    message?: string

    @ApiProperty({ example: 'Forbidden', description: 'Тип ошибки' })
    error: string

    @ApiProperty({ example: 403, description: 'Код ошибки' })
    statusCode: number
}