import { Module } from '@nestjs/common';
import { FieldvalService } from './fieldval.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "FIELDS_SERVICE_CREATE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'fields.create',
          queueOptions: {
            durable: false,
          }
        }
      },
      {
        name: "FIELDS_SERVICE_UPDATE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'fields.update',
          queueOptions: {
            durable: false,
          }
        }
      },
      {
        name: "FIELDS_SERVICE_DELETE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'fields.delete',
          queueOptions: {
            durable: false,
          }
        }
      },
      {
        name: "FIELDS_SERVICE_GET",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'fields.get',
          queueOptions: {
            durable: false,
          }
        }
      },
      {
        name: "FIELDS_SERVICE_GET_FOR_TASK",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'fields.get.fortask',
          queueOptions: {
            durable: false,
          }
        }
      }
    ]),
  ],
  providers: [FieldvalService],
  exports: [
    FieldvalService
  ]
})
export class FieldvalModule {}
