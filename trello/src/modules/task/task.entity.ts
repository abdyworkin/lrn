import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, UsingJoinTableIsNotAllowedError, OneToMany } from "typeorm"
import { User, UserOutputData } from "../user/user.entity"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { List } from "../list/list.entity"
import { Project } from "../project/project.entity"
import { TaskFieldNumber } from "src/entities/task_field_number.entity"
import { TaskFieldString } from "src/entities/task_field_string.entity"
import { TaskFieldEnum } from "src/entities/task_field_enum.entity"

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

    @OneToMany(() => TaskFieldNumber, t => t.task)
    numberFields: TaskFieldNumber[]

    @OneToMany(() => TaskFieldString, t => t.task)
    stringFields: TaskFieldString[]

    @OneToMany(() => TaskFieldEnum, t => t.task)
    enumFields: TaskFieldEnum[]
    
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
    static get(task: Task): TaskOutputData  {
        let fields = [ ...task.stringFields, ...task.numberFields, ...task.enumFields ].map(e => ({ id: e.projectTaskFieldId, value: e.value }))

        const data: TaskOutputData = {
            id: task.id,
            title: task.title,
            description: task.description,
            position: task.position,
            author: UserOutputData.get(task.author),
            fields: fields.sort((a, b) => a.id - b.id),
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

    @ApiProperty({ type: () => [FieldValueOutputData], description: 'Значения полей задачи' })
    fields: FieldValueOutputData[]

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