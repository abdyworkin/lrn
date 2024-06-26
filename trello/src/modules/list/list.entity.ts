import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinTable } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Project } from "../project/project.entity"
import { Task, TaskOutputData } from "../task/task.entity"

@Entity('lists')
export class List {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New List" })
    title: string

    @Column({ type: 'varchar', length: 255, default: "New List" })
    description: string
    
    @Column({ type: 'int', nullable: false })
    position: number

    @ManyToOne(() => Project, { onDelete: 'CASCADE', cascade: true })
    @JoinTable({ name: 'projectId' })
    project: Project

    @Column()
    projectId: number

    @OneToMany(() => Task, task => task.list)
    tasks: Task[]

    @Column({ type: 'timestamp', default: "NOW()" })
    createdAt: number
}

export class ListOutputData {
    static get(list: List): ListOutputData {
        const data: ListOutputData = {
            id: list.id,
            title: list.title,
            description: list.description,
            position: list.position,
            projectId: list.projectId,
            tasks: list.tasks?.sort((a, b) => a.position - b.position).map(TaskOutputData.get) || [],
            createdAt: list.createdAt
        }
    
        return data
    }

    @ApiProperty({ example: '1', description: 'Уникальный идентефикатор' })
    id: number

    @ApiProperty({ example: 'СПИСОК 1', description: 'Заголовок списка задач' })
    title: string

    @ApiProperty({ example: 'ОПИСАНИЕ СПИСКА 1', description: 'Описание списка задач' })
    description: string

    @ApiProperty({ example: '2', description: 'Номер позиции списка внтури проекта' })
    position: number

    @ApiProperty({ example: '12', description: 'Уникальный идентефикатор проекта, в котором находится список' })
    projectId: number
    
    @ApiProperty({ type: () => [TaskOutputData], description: 'Объекты задач, принадлежащих списку' })
    tasks: TaskOutputData[]
    
    @ApiProperty({ example: '1234512341234', description: "Временная метка создания задачи" })
    createdAt: number
}