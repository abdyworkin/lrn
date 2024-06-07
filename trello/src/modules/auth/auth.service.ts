import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {}

    async login(username: string, password: string) {
        const user = await this.userService.findUserByUsername(username)
        
        if (!user) throw new ForbiddenException('auth/user-not-found')

        if (password !== user.password) throw new UnauthorizedException()

        const payload = { username: user.username, id: user.id }
        return {
            accessToken: await this.jwtService.signAsync(payload)
        }
    }

    async register(username: string, password: string) {
        const user = await this.userService.createUser(username, password) //TODO: пароль хранить захешированным в отдельной таблице
        const payload = { username: user.username, id: user.id }

        return {
            accessToken: this.jwtService.sign(payload)
        } 
    }
}
