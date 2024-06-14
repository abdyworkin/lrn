import { ApiProperty } from "@nestjs/swagger";



export class AccessTokenResponse {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIxIiwiaWQiOjEsImlhdCI6MTcxODEwNzY0NywiZXhwIjoxNzE4MTk0MDQ3fQ.NFSwdN40McSUOr4LP15pWkK3q1hOR-rW0LzVS6bI0nw', description: "Авторизационный jwt-token" })
    accessToken: string
}