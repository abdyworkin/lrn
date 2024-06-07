import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { UserService } from "src/modules/user/user.service";


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        @Inject()
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