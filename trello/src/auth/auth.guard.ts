import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { User } from "src/user/user.repo";
import { UserService } from "src/user/user.service";
import { Repository } from "typeorm";



@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userSerivce: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const token = this.getTokenFromHeader(req)

        if (!token) throw new UnauthorizedException()

        try {
            const payload = this.jwtService.verify(token)
            const user = await this.userSerivce.findUserById(payload.id)

            req.user = user
        } catch (e) {
            throw new UnauthorizedException(e)
        }

        return true
    }

    getTokenFromHeader(req: Request): string | undefined {
        const [type, token] = req.headers.authorization?.split(' ') ?? []

        return type === 'Bearer' ? token : undefined
    }

}