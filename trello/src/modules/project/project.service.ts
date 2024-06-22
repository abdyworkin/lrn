import { BadRequestException, FileTypeValidator, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserToProject, ProjectRoles } from '../../entities/user_to_project.entity';
import { Project } from './project.entity';
import { FieldType, ProjectTaskFieldEnumOptions, ProjectTaskField } from 'src/modules/field/project_field.entity';
import { FieldService } from '../field/field.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';


//TODO: удалить после того как все закончу
const projectRelations = [
    'users.user',
    'fields.enumOptions',
    'lists.tasks.author', 
    'lists.tasks.project.fields',
    'lists.tasks.stringFields',
    'lists.tasks.numberFields',
    'lists.tasks.enumFields',
]

@Injectable()
export class ProjectService {
    constructor(
        @Inject()
        private readonly fieldService: FieldService,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(UserToProject)
        private readonly userToProjectRepository: Repository<UserToProject>,
        @InjectRepository(ProjectTaskField)
        private readonly projectTaskFieldRepository: Repository<ProjectTaskField>,
        @InjectRepository(ProjectTaskFieldEnumOptions)
        private readonly projectTaskFieldEnumOptionsRepository: Repository<ProjectTaskFieldEnumOptions>,
        private readonly dataSource: DataSource,
    ) {}

    async runInTransaction(func: (manager: EntityManager) => Promise<any>) {
        return await this.dataSource.transaction(async manager => await func(manager))
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
            relations: projectRelations.map(e => `project.${e}`) //TODO: требуется оптимизация, в отношении не должны догружаться таски
        })

        const projects = projectsRelated.map(e => e.project)
        return projects
    }

    async getProject(id: number, manager?: EntityManager) {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const project = await projectRepo.findOne({ where: { id }, relations: projectRelations })
        return project
    }

    //TODO: add manager option
    async createProject({ title, description, fields }: CreateProjectDto, userId: number, manager?: EntityManager): Promise<Project> {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const userToProjectRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository

        const [inviteCode, inviteExpires] = this.generateInviteCode()

        const newProject = new Project()
        newProject.title = title
        newProject.description = description
        newProject.inviteCode = inviteCode
        newProject.inviteExpires = inviteExpires

        await projectRepo.save(newProject)

        if(fields) {
            newProject.fields = await this.fieldService.createFields(newProject.id, fields, manager)
        }

        const userToProject = new UserToProject()
        userToProject.userId = userId
        userToProject.projectId = newProject.id
        userToProject.role = ProjectRoles.Creator
        newProject.users = [await userToProjectRepo.save(userToProject)]

        return await this.getProject(newProject.id, manager)
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

        return await projectRepo.save(project)
    }

    async deleteProject(projectId: number, manager?: EntityManager) {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const {affected} = await projectRepo.delete(projectId)
        return affected > 0
    }

    async createInviteCode(projectId: number, manager?: EntityManager): Promise<[string, number]> {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository

        const [inviteCode, expires] = this.generateInviteCode()
        
        const result = await projectRepo.update({ id: projectId }, { inviteCode, inviteExpires: expires })

        return result.affected > 0 && [ inviteCode, expires ]
    }

    private generateInviteCode(): [string, number] {
        return [hashSync(Math.random().toString(), 10).replaceAll('/', ''), Date.now() + (1000 * 60 *  60 * 24)]
    }

    async joinByCode(code: string, projectId: number, userId: number, manager?: EntityManager) {
        const projectRepo = manager?.getRepository(Project) || this.projectRepository
        const userToProjectRepo = manager?.getRepository(UserToProject) || this.userToProjectRepository

        const project = await projectRepo.findOne({ where: { id: projectId }, relations: [ 'users.user' ] })

        if(!project) throw new NotFoundException('project/not-found')
        if(project.users.findIndex(e => e.userId === userId) !== -1) return project

        if(code !== project.inviteCode) throw new ForbiddenException()
        if(Date.now() > project.inviteExpires) throw new ForbiddenException()
        
        //TODO: возможно не стоит передавать весь объект, проверить
        const userToProject = new UserToProject()
        userToProject.userId = userId
        userToProject.projectId = project.id
        userToProject.role = ProjectRoles.User
        await userToProjectRepo.save(userToProject)

        project.users = [...project.users, userToProject]

        return await projectRepo.save(project)
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

        const projectUsers = await userToProjectRepo.find({ where: { projectId }, relations: [ 'user' ] })

        //Крайний случай: последний пользователь выходит из проекта, проект удаляется
        if (projectUsers.length === 1 && projectUsers[0].user.id === userId) {
            const result = await projectRepo.delete(projectId)
            return !!result
        }

        //TODO: давать роль модератора, либо пользователю, которого назначил бывший модератор, либо следующему по списку
        //TODO: сделать нормальный вывод
        const userToProjectEntity = projectUsers.filter(e => e.user.id === userId)[0]
        const result = await userToProjectRepo.remove(userToProjectEntity)
        return !!result
    }
}

