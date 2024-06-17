import { BadRequestException, FileTypeValidator, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import { User } from 'src/modules/user/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UserToProject, ProjectRoles } from '../../entities/user_to_project.entity';
import { Project } from './project.entity';
import { FieldType, ProjectTaskFieldEnumOptions, ProjectTaskFields } from 'src/entities/project_field.entity';
import { AddFieldDto, EditFieldDto } from './project.dto';


const projectRelations = [
    'tasks.author', 
    'tasks.project.fields',
    'tasks.stringFields',
    'tasks.numberFields',
    'tasks.enumFields',
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
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(UserToProject)
        private readonly userToProjectRepository: Repository<UserToProject>,
        @InjectRepository(ProjectTaskFields)
        private readonly projectTaskFieldRepository: Repository<ProjectTaskFields>,
        @InjectRepository(ProjectTaskFieldEnumOptions)
        private readonly projectTaskFieldEnumOptionsRepository: Repository<ProjectTaskFieldEnumOptions>,
        private readonly dataSource: DataSource,
    ) {}


    async getAllUserProjects(userId: number) {
        const projectsRelated = await this.userToProjectRepository.find({ 
            where: { userId }, 
            relations: projectRelations.map(e => `project.${e}`)
        })

        const projects = projectsRelated.map(e => e.project).map(this.fillProjectRelation)
        return projects
    }

    async getProject(id: number) {
        const project = await this.projectRepository.findOne({ where: { id }, relations: projectRelations })
        return this.fillProjectRelation(project)
    }

    async createProject({ title, description, user, fields }: {
        user: User,
        title: string,
        description: string,
        fields?: AddFieldDto[]
    }) {
        const [inviteCode, inviteExpires] = this.generateInviteCode()

        const newProject = new Project()
        newProject.title = title
        newProject.description = description
        newProject.inviteCode = inviteCode
        newProject.inviteExpires = inviteExpires

        await this.projectRepository.save(newProject)

        if(fields) {
            newProject.fields = await this.createFields(newProject.id, fields)
        }

        const userToProject = new UserToProject()
        userToProject.user = user
        userToProject.projectId = newProject.id
        userToProject.role = ProjectRoles.Creator
        newProject.users = [await this.userToProjectRepository.save(userToProject)]

        return newProject
    }

    async updateProjectMeta({ project, title, description, fields }: {
        project: Project, 
        fields?: EditFieldDto[],
        title?: string, 
        description?: string
    }): Promise<Project | undefined> {
        project.title = title || project.title
        project.description = description || project.description

        if(fields) {
            const updatedFields = await this.updateProjectFields(fields, project)
            if(!updatedFields) return undefined
            project.fields = updatedFields
        }

        return await this.projectRepository.save(project)
    }

    async updateProjectFields(
        fields: EditFieldDto[],
        project: Project
    ): Promise<ProjectTaskFields[] | undefined> {
        const edittedFields = []
        
        for(let f of fields) {
            const field = project.fields.find(e => e.id === f.id)
            if(!field) throw new BadRequestException(`Field id(${f.id}) does not exist`)
            
            if(field.type === FieldType.Enum || f.type === FieldType.Enum) {
                const newOptions = await this.updateEnumFieldOptions(field.id, f.options)
                if(!newOptions) return undefined
                field.enumOptions = newOptions
            }

            field.type = f.type || field.type
            field.title = f.title || field.title

            edittedFields.push(field)
        }

        return await this.projectTaskFieldRepository.save(edittedFields)
    }

    async updateEnumFieldOptions(
        fieldId: number,
        options: string[] = [],
    ): Promise<ProjectTaskFieldEnumOptions[] | undefined> {
        const deleteResult = await this.projectTaskFieldEnumOptionsRepository.createQueryBuilder()
            .delete()
            .from(ProjectTaskFieldEnumOptions)
            .where('fieldId = :fieldId', { fieldId })
            .execute()

       return await this.createOptions(fieldId, options)
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

    //TODO: проверить, стоит ли передавать само поле
    async addField(projectId: number, arg: AddFieldDto): Promise<ProjectTaskFields> {
        const result = (await this.createFields(projectId, [ arg ]))[0]
        if(!result) throw new InternalServerErrorException()
        return result
    }

    async addManyFields(projectId: number, args: AddFieldDto[]): Promise<ProjectTaskFields[]> {
        return await this.createFields(projectId, args)
    }

    private async createFields(projectId: number, fields: AddFieldDto[]): Promise<ProjectTaskFields[]> {
        const fieldEntities: ProjectTaskFields[] = []
        for(let fieldData of fields) {
            const field = new ProjectTaskFields()
            field.type = fieldData.type
            field.title = fieldData.title
            field.projectId = projectId

            fieldEntities.push(field)
        }
        const savedEntities = await this.projectTaskFieldRepository.save(fieldEntities)

        //TODO: обрабатывать ошибку иначе
        if(savedEntities.length !== fieldEntities.length) throw new InternalServerErrorException('saved entities diff')

        for(let i = 0; i < savedEntities.length; i++) {
            if(fields[i].type === FieldType.Enum) {
                savedEntities[i].enumOptions = await this.createOptions(savedEntities[i].id, fields[i].options)
            }
        }

        return savedEntities
    }

    // Добавляет отдельные варианты для полей с типом enum в базу
    private async createOptions(fieldId: number, options: string[]): Promise<ProjectTaskFieldEnumOptions[]> {
        if(options.length === 0) return []

        const optionEntities = options.map(e => {
            const fieldOption = new ProjectTaskFieldEnumOptions()
            fieldOption.fieldId = fieldId
            fieldOption.option = e
            return fieldOption
        })
        
        return await this.projectTaskFieldEnumOptionsRepository.save(optionEntities)
    }


    private fillProjectRelation(project: Project) {
        if(!project) return undefined

        for(let list of project.lists) {
            list.project = project
            for(let task of list.tasks) {
                task.project = project
            }
        }
        return project
    }
}

