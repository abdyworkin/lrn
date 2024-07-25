import { Inject, Injectable } from '@nestjs/common';
import { ClientProvider, ClientProxy } from '@nestjs/microservices';

@Injectable()
export class FieldvalService {
    constructor(
        @Inject("FIELDS_SERVICE_CREATE") private readonly createClient: ClientProxy,
        @Inject("FIELDS_SERVICE_UPDATE") private readonly updateClient: ClientProxy,
        @Inject("FIELDS_SERVICE_DELETE") private readonly deleteClient: ClientProxy,
        @Inject("FIELDS_SERVICE_GET") private readonly getClient: ClientProxy,
        @Inject("FIELDS_SERVICE_GET_FOR_TASK") private readonly getForTaskClient: ClientProxy,
    ){}
}
