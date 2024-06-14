import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User, UserOutputData, getUserOutputData } from "../modules/user/user.entity";
import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import { Project } from "../modules/project/project.entity";

// Для простоты
export enum ProjectRoles {
    Creator = 'creator',
    User = 'user',
    Banned = 'banned',
}

@Entity('user_to_project')
export class UserToProject {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 30, nullable: false, default: ProjectRoles.User })
    role: ProjectRoles

    @ManyToOne(() => Project, project => project.users, {
        onDelete: 'CASCADE',
        cascade: true
    })
    @JoinColumn({ name: 'projectId' })
    project: Project

    @Column()
    projectId: number

    @ManyToOne(() => User, user => user.projects, {
        onDelete: 'CASCADE',
        cascade: true
    })
    @JoinColumn({ name: 'userId' })
    user: User

    @Column()
    userId: number
}

export class ProjectUserOutputData {
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    id: number

    @ApiProperty({ example: 'ivan1234', description: 'Уникальное имя пользователя' })
    username: string

    @ApiProperty({ example: 'creator', description: 'Роль пользователя в проекте' })
    role: string
}

export const getUserFromRelation = (u: UserToProject): ProjectUserOutputData => {
    return {
        ...getUserOutputData(u.user),
        role: u.role,
    } 
}