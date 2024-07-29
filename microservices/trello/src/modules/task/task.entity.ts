import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, UsingJoinTableIsNotAllowedError, OneToMany } from "typeorm"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { List } from "../list/list.entity"
import { Project } from "../project/project.entity"
import { User } from "../auth/auth.dto"
import { UserOutputData } from "../project/user_to_project.entity"
import { FieldValue } from "../fieldval/fieldval.dto"

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

    @Column({ type: 'int', nullable: false })
    authorId: number

    author: User

    // @OneToMany(() => TaskFieldNumber, t => t.task)
    // numberFields: TaskFieldNumber[]

    // @OneToMany(() => TaskFieldString, t => t.task)
    // stringFields: TaskFieldString[]

    // @OneToMany(() => TaskFieldEnum, t => t.task)
    // enumFields: TaskFieldEnum[]
    fields: FieldValue[]

    @ManyToOne(() => List, {
        cascade: true,
        onDelete: "CASCADE"
    })
    @JoinTable({ name: 'listId' })
    list: List

    @Column()
    listId: number

    @ManyToOne(() => Project, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    @JoinTable({ name: 'projectId' })
    project: Project

    @Column()
    projectId: number

    @Column({ type: 'timestamp', default: "NOW()" })
    createdAt: number
}

export class TaskOutputData {
    static get(task: Task): TaskOutputData  {
        //let fields = [ ...(task?.stringFields || []), ...(task?.numberFields || []), ...(task?.enumFields || []) ].map(e => ({ id: e.projectTaskFieldId, value: e.value }))

        const data: TaskOutputData = {
            id: task.id,
            title: task.title,
            description: task.description,
            position: task.position,
            authorId: task.authorId,
            author: task.author,
            fields: task.fields || [],
            listId: task.listId,
            createdAt: task.createdAt
        }

        return data
    }

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

    // TODO: догружать данные пользователя по id
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор автора задачи' })
    authorId: number

    @ApiProperty({ type: () => [FieldValue], description: 'Значения полей задачи' })
    fields: FieldValue[]

    @ApiProperty({ example: '1', description: "Уникальный идетификатор списка, в котором находится задача" })
    listId: number

    @ApiProperty({ example: '1234512341234', description: "Временная метка создания задачи" })
    createdAt: number
}

export class FieldValueOutputData {
    @ApiProperty({ example: '1', description: "Уникальный идентификатор поля" })
    id: number

    @ApiPropertyOptional({ example: 'Параметр 1', description: 'Название поля' })
    title?: string

    @ApiProperty({ example: '2', description: 'Значение поля' })
    value: number | string
}