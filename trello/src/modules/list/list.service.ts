import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { List } from './list.entity';
import { CreateListDto, UpdateListMetaDto } from './list.dto';

@Injectable()
export class ListService {
    constructor(
        @InjectRepository(List)
        private readonly listRepository: Repository<List>,
        private readonly dataSrouce: DataSource
    ) {}

    async runInTransaction(func: (manager: EntityManager) => Promise<any>) {
        return await this.dataSrouce.transaction(async manager => await func(manager))
    }

    async getListById(listId: number, manager?: EntityManager) {
        const listRepo = manager?.getRepository(List) || this.listRepository

        return await listRepo.findOne({ 
            where: { id: listId }, 
            relations: [ 
                'tasks.author', 
                'tasks.numberFields',
                'tasks.stringFields',
                'tasks.enumFields',
            ] 
        })
    }

    async createList(projectId: number, { title, description }: CreateListDto, manager?: EntityManager) {
        const listRepo = manager?.getRepository(List) || this.listRepository

        const newList = new List()
        newList.title = title
        newList.description = description

        newList.projectId = projectId
        
        const maxPosition = await listRepo
            .createQueryBuilder('list')
            .select('MAX(list.position)', 'max')
            .where('list.projectId = :id', { id: projectId })
            .getRawOne();

        newList.position = maxPosition.max ? Number(maxPosition.max) + 1 : 1;
        return await listRepo.save(newList)
    }

    //TODO: передавать данные через объект
    async updateListMeta(listId: number, { title, description }: UpdateListMetaDto, manager?: EntityManager) {
        const listRepo = manager?.getRepository(List) || this.listRepository

        const result = await listRepo.update({ id: listId }, {
            title, description
        })

        if(result.affected === 0) throw new InternalServerErrorException()

        return result.generatedMaps[0]
    }

    async deleteList(listId: number, manager?: EntityManager) {
        const listRepo = manager?.getRepository(List) || this.listRepository

        const result = await listRepo.delete(listId)
        return result.affected > 0
    }

    async moveList(listId: number, to: number, manager: EntityManager) {
        const queryBuilder = manager.createQueryBuilder()

        const list = await this.getListById(listId)
        
        if(!list) throw new NotFoundException()

        await queryBuilder.update(List)
            .set({ position: -1 })
            .where("position=:from", { from: list.position })
            .andWhere("projectId = :projectId", { projectId: list.projectId })
            .execute()

        if (list.position < to) {
            //Двигаем вниз
            await queryBuilder
                .update(List)
                .set({ position: () => "position - 1" })
                .where("position > :from", { from: list.position })
                .andWhere("position <= :to", { to })
                .andWhere("projectId = :projectId", { projectId: list.projectId })
                .execute();
        } else {
            //Двигаем вверх
            await queryBuilder
                .update(List)
                .set({ position: () => "position + 1" })
                .where("position < :from", { from: list.position})
                .andWhere("position >= :to", { to })
                .andWhere("projectId = :projectId", { projectId: list.projectId })
                .execute();
        }


        return await queryBuilder
            .update(List)
            .set({ position: to })
            .where("position = -1")
            .andWhere("projectId = :projectId", { projectId: list.projectId })
            .execute();
    }

}
