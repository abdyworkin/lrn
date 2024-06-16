import { ApiProperty, ApiPropertyOptional, ApiRequestTimeoutResponse } from "@nestjs/swagger";
import { Project } from "src/modules/project/project.entity";
import { Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum FieldType {
    String = 'string',
    Number = 'number',
    Enum = 'enum'
}

@Entity("project_task_fields")
export class ProjectTaskFields {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 125 })
    title: string

    @Column({ type: 'varchar', length: 10, nullable: false })
    type: FieldType

    @ManyToOne(() => Project, p => p.fields, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    @JoinTable({ name: 'projectId' })
    project: Project

    @Column()
    projectId: number

    @OneToMany(() => ProjectTaskFieldEnumOptions, p => p.field)
    enumOptions: ProjectTaskFieldEnumOptions[]
}

@Entity("project_task_field_enum_options")
export class ProjectTaskFieldEnumOptions {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => ProjectTaskFields, p => p.enumOptions, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    @JoinTable({ name: 'fieldId' })
    field: ProjectTaskFields

    @Column()
    fieldId: number

    @Column({ type: 'varchar', length: 30, nullable: false })
    option: string
}


export class ProjectTaskFieldOutputData {
    static get(p: ProjectTaskFields): ProjectTaskFieldOutputData {
        const data: ProjectTaskFieldOutputData = {
            id: p.id,
            title: p.title,
            type: p.type,
            enumOptions: p.enumOptions
        }
    
        return data
    }

    @ApiProperty({ example: '1', description: "Уникальный идентификатор" })
    id: number

    @ApiProperty({ example: 'Поле 1', description: 'Заголовок поля' })
    title: string

    @ApiProperty({ example: 'enum', description: 'Тип данных, хранящихся в поле' })
    type: string

    @ApiPropertyOptional({ type: () => [ProjectTaskFieldEnumOptionsOutputData], description: 'Значения, которые принимает enum поле' })
    enumOptions: ProjectTaskFieldEnumOptionsOutputData[]
}


export class ProjectTaskFieldEnumOptionsOutputData {
    public static get(p: ProjectTaskFieldEnumOptions): ProjectTaskFieldEnumOptionsOutputData {
        const data: ProjectTaskFieldEnumOptionsOutputData = {
            id: p.id,
            fieldId: p.fieldId,
            option: p.option
        }
        return data
    }

    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    id: number

    @ApiProperty({ example: '1', description: 'Уникальный идентификатор enum поля' })
    fieldId: number

    @ApiProperty({ example: 'В работе', description: 'Значение enum поля' })
    option: string
}

