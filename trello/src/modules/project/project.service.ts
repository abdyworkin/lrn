import { ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import { User } from 'src/modules/user/user.entity';
import { Repository } from 'typeorm';
import { UserToProject, ProjectRoles } from '../../entities/user_to_project.entity';
import { Project } from './project.entity';

const projectRelations = [
    'lists.tasks.author', // все задачи, до автора
    'users.user', // Все участники проекта
    'fields'
]

@Injectable()
export class ProjectService {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(UserToProject)
        private readonly userToProjectRepository: Repository<UserToProject>,
    ) {}


    async getAllUserProjects(userId: number) {
        const projectsRelated = await this.userToProjectRepository.find({ 
            where: { userId }, 
            relations: projectRelations.map(e => `project.${e}`)
        })

        const projects = projectsRelated.map(e => e.project)
        return projects
    }

    async getProject(id: number) {
        const project = await this.projectRepository.findOne({ where: { id }, relations: projectRelations })
        return project
    }

    async createProject(data: {
        userId: number,
        title: string,
        description: string,
    }) {
        const [inviteCode, inviteExpires] = this.generateInviteCode()

        const { title, description, userId } = data

        const newProject = new Project()
        newProject.title = title
        newProject.description = description
        newProject.inviteCode = inviteCode
        newProject.inviteExpires = inviteExpires
        await this.projectRepository.save(newProject)

        const userToProject = new UserToProject()
        userToProject.userId = userId
        userToProject.projectId = newProject.id
        userToProject.role = ProjectRoles.Creator
        await this.userToProjectRepository.save(userToProject)

        return await this.projectRepository.findOneBy({ id: newProject.id })
    }

    async updateProjectMeta(project: Project, title?: string, description?: string) {
        project.title = title || project.title
        project.description = description || project.description
        
        return await this.projectRepository.save(project)
    }

    async deleteProject(project: Project) {
        const {affected} = await this.projectRepository.delete(project.id)
        return affected > 0
    }

    async createInviteCode(project: Project) {
        const [inviteCode, expires] = this.generateInviteCode()
        
        project.inviteCode = inviteCode
        project.inviteExpires = expires

        return await this.projectRepository.save(project)
    }

    private generateInviteCode(): [string, number] {
        return [hashSync(Math.random().toString(), 10).replaceAll('/', ''), Date.now() + (1000 * 60 *  60 * 24)]
    }


    async joinByCode(code: string, projectId: number, user: User) {
        const project = await this.projectRepository.findOne({ where: { id: projectId }, relations: [ 'users.user' ] })

        if(!project) throw new NotFoundException('project/not-found')
        if(project.users.findIndex(e => e.userId === user.id) !== -1) return project

        if(code !== project.inviteCode) throw new ForbiddenException()
        if(Date.now() > project.inviteExpires) throw new ForbiddenException()
        
        //TODO: возможно не стоит передавать весь объект, проверить
        const userToProject = new UserToProject()
        userToProject.user = user
        userToProject.projectId = project.id
        userToProject.role = ProjectRoles.User
        await this.userToProjectRepository.save(userToProject)

        project.users = [...project.users, userToProject]

        return await this.projectRepository.save(project)
    }

    async kickUser(userId: number, project: Project, ban?: boolean) {
        if(ban) {
            // Помечаем пользователя зашкваренным
            const result = await this.userToProjectRepository.update({ userId, projectId: project.id }, { role: ProjectRoles.Banned })
            return result.affected === 1
        }

        // Просто убираем пользователя
        const result = await this.userToProjectRepository.delete({ userId: userId, projectId: project.id })
        return result.affected === 1
    }

    async leaveProject(user: User, project: Project): Promise<boolean> {
        //Крайний случай: последний пользователь выходит из проекта, проект удаляется
        if (project.users.length === 1 && project.users[0].user.id === user.id) {
            const result = await this.projectRepository.remove(project)
            return !!result
        }

        //TODO: давать роль модератора, либо пользователю, которого назначил бывший модератор, либо следующему по списку
        //TODO: сделать нормальный вывод
        const userToProjectEntity = project.users.filter(e => e.user.id === user.id)[0]
        const result = await this.userToProjectRepository.remove(userToProjectEntity)
        return !!result
    }
}
