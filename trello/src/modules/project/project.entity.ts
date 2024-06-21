import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { List, ListOutputData } from "../list/list.entity"
import { Task } from "../task/task.entity"
import { UserToProject, ProjectUserOutputData } from "../../entities/user_to_project.entity"
import { ProjectTaskFieldOutputData, ProjectTaskField } from "src/modules/field/project_field.entity"

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New Project" })
    title: string
    
    @Column({ type: 'varchar', length: 255, default: "New Project" })
    description: string

    @Column({ type: 'varchar', length: 500, nullable: false })
    inviteCode: string

    @Column({ type: 'bigint', nullable: false })
    inviteExpires: number

    @OneToMany(() => ProjectTaskField, p => p.project)
    fields: ProjectTaskField[]

    // Relations
    @OneToMany(() => List, list => list.project)
    lists: List[]

    @OneToMany(() => Task, task => task.project)
    tasks: Task[]

    @OneToMany(() => UserToProject, p => p.project)
    users: UserToProject[]

    @Column({ type: 'timestamp', default: 'NOW()' })
    createdAt: number
}


export class ProjectOutputData {
    static get(p: Project): ProjectOutputData {
        const data: ProjectOutputData = {
            id: p.id,
            title: p.title,
            description: p.description,
            inviteCode: p.inviteCode,
            fields: p.fields?.map(ProjectTaskFieldOutputData.get) || [],
            lists: p.lists?.sort((a, b) => a.position - b.position).map(ListOutputData.get) || [],
            users: p.users?.map(ProjectUserOutputData.get) || [],
            createdAt: p.createdAt
        }
        return data
    }

    @ApiProperty({ example: '1', description: "Уникальный идетификатор" })
    id: number

    @ApiProperty({ example: 'Важный проект 1', description: "Заголовок проекта" })
    title: string

    @ApiProperty({ example: 'Делаем большие дела', description: "Описание проекта" })
    description: string

    @ApiProperty({ example: '1o2in3oin12oinfqw09fj209jf90fj12f3', description: "Код приглашения" })
    inviteCode: string

    @ApiProperty({ type: () => [ProjectTaskFieldOutputData], description: 'Дополнительные поля задач в проекте' })
    fields: ProjectTaskFieldOutputData[]

    @ApiProperty({ type: () => [ListOutputData], description: "Объекты списков проекта" })
    lists: ListOutputData[]

    @ApiProperty({ type: () => [ProjectUserOutputData], description: 'Участники проекта' })
    users: ProjectUserOutputData[]

    @ApiProperty({ example: '1124312341234', description: "Временная метка создания проекта" })
    createdAt: number
}
