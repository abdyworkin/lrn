import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject()
        private authService: AuthService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const token = this.getTokenFromHeader(req)

        if (!token) throw new UnauthorizedException()

        const result = await this.authService.checkToken(token)
        req.user = result

        return true
    }

    private getTokenFromHeader(req: Request): string | undefined {
        const [type, token] = req.headers.authorization?.split(' ') ?? []

        return type === 'Bearer' ? token : undefined
    }

}