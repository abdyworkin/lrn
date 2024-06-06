import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.repo';
import { Repository } from 'typeorm';
import { hash } from  'bcryptjs'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) 
        private readonly userRepository: Repository<User>
    ) {}

    async findUserByUsername(username: string): Promise<User | null> {
        return this.userRepository.findOneBy({ username })
    }

    async findUserById(id: number): Promise<User | null> {
        return this.userRepository.findOneBy({ id })
    }

    async createUser(username: string, password: string) {
        if (await this.findUserByUsername(username)) { //TODO: оптимизировать
            throw new ForbiddenException('auth/user-already-exists')
        }

        const user = new User()
        user.username = username
        user.password = password

        return this.userRepository.save(user)
    }
}
