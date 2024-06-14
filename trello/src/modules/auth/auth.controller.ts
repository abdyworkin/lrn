import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegistationDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/user/user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenResponse } from './auth.response';
import { ErrorResponse } from '../app.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ){}

    @ApiOperation({ summary: 'Аутентификация' })
    @ApiResponse({ status: 201, type: AccessTokenResponse })
    @ApiResponse({ status: 403, type: ErrorResponse })
    @Post('/login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.username, body.password)
    }

    @ApiOperation({ summary: 'Регистрация нового пользователя' })
    @ApiResponse({ status: 201, type: AccessTokenResponse })
    @Post('/register')
    async register(@Body() body: RegistationDto) {
        return await this.authService.register(body.username, body.password)
    }

    async generateToken(user: User): Promise<string> {
        const payload = { username: user.username, id: user.id }
        return await this.jwtService.signAsync(payload)
    }

}
