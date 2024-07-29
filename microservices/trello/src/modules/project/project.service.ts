import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserToProject, ProjectRoles, ProjectUserOutputData } from './user_to_project.entity';
import { Project } from './project.entity';
import { FieldService } from '../field/field.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/auth.dto';
import { FieldvalService } from '../fieldval/fieldval.service';

const projectRelations = [
    'users',
    'fields.enumOptions',
    'lists.tasks.project.fields',
]

@Injectable()
export class ProjectService {
    constructor(
        @Inject()
        private readonly fieldService: FieldService,
        @Inject()
        private readonly fieldvalService: FieldvalService,
        @Inject()
        private readonly authService: AuthService,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(UserToProject)
        private readonly userToProjectRepository: Repository<UserToProject>,
        private readonly dataSource: DataSource,
    ) {}

    async runInTransaction(func: (manager: EntityManager) => Promise<any>) {
        const result = await this.dataSource.transaction(async manager => {
                return await func(manager)
        })
        return result
    }

    async getUserRole(projectId: number, userId: number, manager?: EntityManager): Promise<ProjectRoles | undefined> {
        const userToProjectRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository
        const user = await userToProjectRepo.findOne({ where: { projectId, userId } })
        if(!user) return undefined

        return user.role
    }

    async getAllUserProjects(userId: number, manager?: EntityManager) {
        const pUserRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository

        const projectsRelated = await pUserRepo.find({ 
            where: { userId }, 
            relations: projectRelations.map(e => `project.${e}`)
        })

        const projects = []
        for (let p of projectsRelated) {
            projects.push(await this.fieldvalService.populateProject(await this.populateUsers(p.project)))
        }

        return projects
    }

    async getProject(id: number, manager?: EntityManager) {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const project = await projectRepo.findOne({ where: { id }, relations: projectRelations })

        const pWithUsers = await this.populateUsers(project)
        const pWithFields = await this.fieldvalService.populateProject(pWithUsers)

        return pWithFields
    }

    async createProject({ title, description, fields }: CreateProjectDto, userId: number, manager?: EntityManager): Promise<Project> {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const userToProjectRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository

        const [inviteCode, inviteExpires] = this.generateInviteCode()

        const newProject = new Project()
        newProject.title = title
        newProject.description = description
        newProject.inviteCode = inviteCode
        newProject.inviteExpires = inviteExpires
        newProject.lists = []

        await projectRepo.save(newProject)

        if(fields) {
            newProject.fields = await this.fieldService.createFields(newProject.id, fields, manager)
        }

        const userToProject = new UserToProject()
        userToProject.userId = userId
        userToProject.projectId = newProject.id
        userToProject.role = ProjectRoles.Creator
        newProject.users = [await userToProjectRepo.save(userToProject)]

        const projectWithUsers = await this.populateUsers(newProject)
        const projectWithFields = await this.fieldvalService.populateProject(projectWithUsers)

        return projectWithFields
    }

    async updateProject(projectId: number, { title, description, fields }: UpdateProjectDto, manager?: EntityManager): Promise<Project | undefined> {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const project = await projectRepo.findOne({ where: { id: projectId } })
        if(!project) throw new NotFoundException('Project not found')

        project.title = title || project.title
        project.description = description || project.description

        if(fields) {
            const updatedFields = await this.fieldService.updateFields(projectId, fields, manager)
            project.fields = updatedFields
        }

        const savedProject = await projectRepo.save(project)
        const projectWithUsers = await this.populateUsers(savedProject)
        const projectWithFields = await this.fieldvalService.populateProject(projectWithUsers)

        return projectWithFields
    }

    async deleteProject(projectId: number, manager?: EntityManager) {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const project = await this.getProject(projectId, manager)
        
        const { affected } = await projectRepo.delete(projectId)

        if (affected > 0) {
            await this.fieldvalService.deleteByField(project.fields.map(e => e.id))
        }

        return affected > 0
    }

    async createInviteCode(projectId: number, manager?: EntityManager) {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository

        const [inviteCode, expires] = this.generateInviteCode()
        
        const result = await projectRepo.update({ id: projectId }, { inviteCode, inviteExpires: expires })

        return result.affected > 0 && { inviteCode, expires }
    }

    private generateInviteCode(): [string, number] {
        return [hashSync(Math.random().toString(), 10).replaceAll('/', ''), Date.now() + (1000 * 60 *  60 * 24)]
    }

    async joinByCode(code: string, projectId: number, userId: number, manager?: EntityManager) {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const userToProjectRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository

        const project = await projectRepo.findOne({ where: { id: projectId }, relations: [ 'users' ] })

        if(!project) throw new NotFoundException('project/not-found')
        if(project.users.findIndex(e => e.userId === userId) !== -1) return project

        if(code !== project.inviteCode) throw new ForbiddenException()
        if(Date.now() > project.inviteExpires) throw new ForbiddenException()
        
        const userToProject = new UserToProject()
        userToProject.userId = userId
        userToProject.projectId = project.id
        userToProject.role = ProjectRoles.User
        await userToProjectRepo.save(userToProject)

        project.users = [...project.users, userToProject]

        return await this.populateUsers(await projectRepo.save(project))
    }

    async kickUser(userId: number, projectId: number, ban: boolean, manager?: EntityManager) {
        const userToProjectRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository

        if(ban) {
            const result = await userToProjectRepo.update({ userId, projectId: projectId }, { role: ProjectRoles.Banned })
            return result.affected === 1
        }

        // Просто убираем пользователя
        const result = await userToProjectRepo.delete({ userId: userId, projectId: projectId })
        return result.affected === 1
    }

    async leaveProject(userId: number, projectId: number, manager?: EntityManager): Promise<boolean> {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const userToProjectRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository

        const projectUsers = await userToProjectRepo.find({ where: { projectId } })

        //Крайний случай: последний пользователь выходит из проекта, проект удаляется
        if (projectUsers.length === 1 && projectUsers[0].userId === userId) {
            const result = await projectRepo.delete(projectId)
            return !!result
        }

        //TODO: давать роль модератора, либо пользователю, которого назначил бывший модератор, либо следующему по списку
        const userToProjectEntity = projectUsers.filter(e => e.userId === userId)[0]
        const result = await userToProjectRepo.remove(userToProjectEntity)
        return !!result
    }

    private async populateUsers(project: Project): Promise<Project> {
        let usersToLoad = project.users.map(e => e.userId)

        const users = await this.authService.getUsersByIds(usersToLoad)
        const userMap: { [id: number]: User } = {}
        users.forEach(e => userMap[e.id] = e)

        console.log('users', usersToLoad, 'got from auth service', users)

        project.users.forEach(e => {
            let foundUser = userMap[e.userId]
            console.log('populating', e, foundUser)

            if(foundUser) {
                e.user = {
                    id: foundUser.id,
                    username: foundUser.username
                }
            }
        })
        
        return project
    }
}

