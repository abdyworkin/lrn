import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user';
import { Repository } from 'typeorm';

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
        const user = await this.userRepository.findOne({ where: { id }, relations: [ 'projects', 'projects.project'] })
        return user
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
