import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProjectRoles } from '../../entities/user_to_project.entity';
import { List } from './list.entity';

@Injectable()
export class ListService {
    constructor(
        @InjectRepository(List)
        private readonly listRepository: Repository<List>,
        private readonly dataSrouce: DataSource
    ) {}


    async getUserProjectRole(userId: number, listId: number): Promise<ProjectRoles | undefined> {
        const list = await this.listRepository.findOne({ 
            where: { 
                id: listId
            },
            relations: [ 'project.users.user' ]
        })

        if(!list) return undefined

        const userRelation = list.project.users.find(e => e.user.id === userId)
        if(!userRelation) return undefined
        return userRelation.role
    }

    async getListById(listId: number) {
        return await this.listRepository.findOne({ where: { id: listId }, relations: [ 'tasks.author', 'project' ] })
    }

    async createList({ title, description, projectId }: {
        title: string, 
        description: string, 
        projectId: number,
    }) {
        const newList = new List()
        newList.title = title
        newList.description = description

        newList.projectId = projectId
        
        const maxPosition = await this.listRepository
            .createQueryBuilder('list')
            .select('MAX(list.position)', 'max')
            .where('list.projectId = :id', { id: projectId })
            .getRawOne();

        newList.position = maxPosition.max ? Number(maxPosition.max) + 1 : 1;
        return await this.listRepository.save(newList)
    }

    //TODO: передавать данные через объект
    async updateListMeta({ listId, title, description }: {
        listId: number,
        title?: string,
        description?: string,
    }) {
        const result = await this.listRepository.update({ id: listId }, {
            title, description
        })

        if(result.affected === 0) throw new InternalServerErrorException()

        return result.generatedMaps[0]
    }

    async deleteList({ listId }: {
        listId: number,
    }) {
        const result = await this.listRepository.delete(listId)
        return result.affected > 0
    }

    async moveList({ listId, to }: { 
        listId: number,
        to: number, 
    }) {
        const result = await this.dataSrouce.transaction(async manager => {
            const queryBuilder = manager.createQueryBuilder();

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
        });

        return result.affected > 0
    }

}
