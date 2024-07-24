import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'auth_queue',
          queueOptions: {
            durable: false,
          }
        }
      }
    ]),
  ],
  providers: [AuthService],
  exports: [
    AuthService
  ]
})
export class AuthModule {}
