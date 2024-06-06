import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        UserModule,
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET || 'SECRET',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        })
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
