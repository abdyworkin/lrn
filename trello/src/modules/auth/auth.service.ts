import { Inject, Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TimeoutError, catchError, firstValueFrom, timeout } from 'rxjs';
import { User } from './auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject('AUTH_SERVICE')
        private readonly client: ClientProxy
    ) {}

    async checkToken(token: string): Promise<{ id: number }> {
        const result = await firstValueFrom(this.client.send({ action: 'validate_token' }, { token }).pipe(
            timeout(5000),
            catchError(err => {
                if(err instanceof TimeoutError) {
                    throw new ServiceUnavailableException('Auth service timeout')
                }
                throw err
            })
        ))

        if(result.type && result.type === 'error') {
            throw new InternalServerErrorException(result.message)
        }

        return result
    } 

    async getUsersByIds(ids: number[]): Promise<User[]> {
        const result = await firstValueFrom(this.client.send({ action: "getusers" }, { ids })
            .pipe(
                timeout(5000),
                catchError(err => {
                    if(err instanceof TimeoutError) {
                        throw new ServiceUnavailableException('Auth service timeout')
                    }
                    throw err
                })
            ))

        if(result.type && result.type === 'error') {
            throw new InternalServerErrorException(result.message)
        }

        return result.users
    }

}
