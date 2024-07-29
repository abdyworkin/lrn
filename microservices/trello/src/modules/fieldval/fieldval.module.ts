import { Module } from '@nestjs/common';
import { FieldvalService } from './fieldval.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "FIELDS_SERVICE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'fields',
          queueOptions: {
            durable: false,
          }
        }
      },
    ]),
  ],
  providers: [FieldvalService],
  exports: [
    FieldvalService
  ]
})
export class FieldvalModule {}
