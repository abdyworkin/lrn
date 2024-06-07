import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./project";
import { User } from "./user";

// Для простоты
export enum ProjectRoles {
    Creator = 'creator',
    User = 'user',
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

export const getUserFromRelation = (u: UserToProject) => ({
    id: u.user.id,
    username: u.user.username,
    role: u.role
})