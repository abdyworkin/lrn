import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, UsingJoinTableIsNotAllowedError, OneToMany } from "typeorm"
import { User, UserOutputData, getUserOutputData } from "../user/user.entity"
import { ApiProperty } from "@nestjs/swagger"
import { List } from "../list/list.entity"
import { Project } from "../project/project.entity"

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New Task" })
    title: string

    @Column({ type: 'varchar', length: 1500, nullable: true })
    description: string

    @Column({ type: 'int', nullable: false })
    position: number

    @ManyToOne(() => User)
    @JoinTable({ name: 'authorId' })
    author: User

    @Column()
    authorId: number

    @ManyToOne(() => List, {
        cascade: true,
        onDelete: "CASCADE"
    })
    @JoinTable({ name: 'listId' })
    list: List

    @Column()
    listId: number

    @ManyToOne(() => Project)
    @JoinTable({ name: 'projectId' })
    project: Project

    @Column()
    projectId: number

    @Column({ type: 'timestamp', default: "NOW()" })
    createdAt: number
}

export class TaskOutputData {
    @ApiProperty({ example: '1', description: "Уникальный идетификатор" })
    id: number

    @ApiProperty({ example: 'Что-то исправить', description: "Заголовок задачи" })
    title: string

    @ApiProperty({ example: 'В одном месте кое-что случайно сломал...', description: "Описание задачи" })
    description: string

    @ApiProperty({ example: '2', description: "Номер позиции задачи внтури списка" })
    position: number

    @ApiProperty({ type: () => UserOutputData, description: 'Объект пользователя автора задачи' })
    author: UserOutputData

    @ApiProperty({ example: '1', description: "Уникальный идетификатор списка, в котором находится задача" })
    listId: number

    @ApiProperty({ example: '1234512341234', description: "Временная метка создания задачи" })
    createdAt: number
}

// Позже возымеет смысл
export const getTaskOutput = (task: Task): TaskOutputData => {
    const data: TaskOutputData = {
        id: task.id,
        title: task.title,
        description: task.description,
        position: task.position,
        author: getUserOutputData(task.author) ,
        listId: task.listId,
        createdAt: task.createdAt
    }

    return data
}