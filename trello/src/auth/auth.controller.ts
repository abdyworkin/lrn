import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegistationDto } from './auth.dto';
import { User } from 'src/user/user.repo';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ){}

    @Post('/login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.username, body.password)
    }

    @Post('/register')
    async register(@Body() body: RegistationDto) {
        return await this.authService.register(body.username, body.password)
    }

    async generateToken(user: User): Promise<string> {
        const payload = { username: user.username, id: user.id }
        return await this.jwtService.signAsync(payload)
    }

}
