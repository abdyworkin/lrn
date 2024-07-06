import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import { Project } from "../modules/project/project.entity";
import { User } from "src/modules/auth/auth.dto";

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

    @Column()
    userId: number

    user: User
}

export class ProjectUserOutputData {
    static get(p: UserToProject): ProjectUserOutputData {
        const data: ProjectUserOutputData = {
            id: p.userId,
            username: p.user ? p.user.username : undefined,
            role: p.role,
        }

        return data
    }

    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    id: number

    @ApiProperty({ example: 'ivan1234', description: 'Уникальное имя пользователя' })
    username: string

    @ApiProperty({ example: 'creator', description: 'Роль пользователя в проекте' })
    role: string
}

export class UserOutputData {
    static get(p: User): UserOutputData {
        const data: UserOutputData = {
            id: p.id,
            username: p.username,
        }

        return data
    }

    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    id: number

    @ApiProperty({ example: 'ivan1234', description: 'Уникальное имя пользователя' })
    username: string
}
