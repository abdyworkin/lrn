import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project, ProjectRoles, UserToProject } from './project.repo';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.repo';

@Injectable()
export class ProjectService {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(UserToProject)
        private readonly userToProjectRepository: Repository<UserToProject>
    ) {}

    async getUserRole(projectId: number, userId: number) {
        // Предполагается, что у пользователя может быть только одна роль в проекте
        const userToProjects = await this.userToProjectRepository.findOneBy({ project: { id: projectId }, user: { id: userId } }) 
        return userToProjects?.role || undefined
    }

    async findProjectById(id: number) {
        const project = await this.projectRepository.findOne({ where: { id }, relations: [ 'projectUsers.user' ] })
        return this.formatProjectData(project)
    }

    async findProjectByAuthorId(id: number) {
        const projects = await this.projectRepository.find({ where: { id }, relations: [ 'projectUsers.user' ] })
        return projects.map(this.formatProjectData)
    }

    async createNewProject(user: User, title: string, description: string) {
        try {
            const project = new Project();
            project.title = title;
            project.description = description;
            
            await this.projectRepository.save(project)

            const userToProject = new UserToProject()
            userToProject.user = user
            userToProject.project = project
            userToProject.role = ProjectRoles.Creator

            await this.userToProjectRepository.save(userToProject) //TODO: похоже на хуйню

            return await this.findProjectById(project.id)
        } catch (error) {
            throw new InternalServerErrorException(error)
        }

    }

    async renameProject(id: number, title: string) {
        const updateResult = await this.projectRepository.createQueryBuilder()
            .update(Project)
            .set({ title })
            .where({ id })
            .returning('*')
            .execute()
        
        return updateResult.raw[0] as Project
    }

    private formatProjectData(project: Project) {
        return {
            id: project.id,
            title: project.title,
            description: project.description,
            users: project.projectUsers.map(u => ({
                ...u.user,
                password: undefined,
                role: u.role
            }))
        }
    }
}
