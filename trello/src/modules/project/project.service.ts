import { ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import { Project, getProjectOutput } from 'src/entities/project';
import { User } from 'src/entities/user';
import { ProjectRoles, UserToProject, getUserFromRelation } from 'src/entities/user_to_project';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectService {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(UserToProject)
        private readonly userToProjectRepository: Repository<UserToProject>,
    ) {}


    async getAllUserProjects(userId: number) {
        const projects = await this.projectRepository.find({ where: { users: { user: { id: userId } } }, relations: ['users'] })
        return projects
    }

    async getProject(id: number) {
        const project = await this.projectRepository.findOne({ where: { id }, relations: ['users', 'users.user'] })
        return project ? getProjectOutput(project) : null
    }

    async createProject(userId: number, title: string, description: string) {
        const [inviteCode, inviteExpires] = this.generateInviteCode()

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
        return affected === 1
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
        
        //TODO: возможно не стоит передавать весь объект
        const userToProject = new UserToProject()
        userToProject.user = user
        userToProject.projectId = project.id
        userToProject.role = ProjectRoles.User
        await this.userToProjectRepository.save(userToProject)

        project.users = [...project.users, userToProject]

        return await this.projectRepository.save(project)
    }
}
